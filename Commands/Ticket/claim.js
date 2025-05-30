const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  EmbedBuilder,
} = require("discord.js");
const db = require("../../db");
const getTicketById = require("../../Functions/getTicket");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claimticket")
    .setDescription("Claim this ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const claimedCategoryId = client.config.TICKETCLAIMED;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to claim tickets.",
        ephemeral: true,
      });
    }

    const channel = interaction.channel;
    const ticketMatch = channel.name.match(/ticket-(?:.+-)?(\d+)$/);
    if (!ticketMatch) {
      return interaction.reply({
        content: "This command can only be used in a ticket channel.",
        ephemeral: true,
      });
    }

    const ticketId = parseInt(ticketMatch[1]);
    const claimedAt = new Date();

    let ticket;
    try {
      ticket = await getTicketById(ticketId);
      if (!ticket) {
        return interaction.reply({
          content: "Ticket not found in database.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error("Database error:", err);
      return interaction.reply({
        content: "Database error while retrieving ticket.",
        ephemeral: true,
      });
    }

    await channel.permissionOverwrites.set([
      {
        id: interaction.guild.id,
        deny: ["ViewChannel"],
      },
      {
        id: client.config.STAFF,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
      {
        id: ticket.user_id,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
    ]);

    db.run(
      `UPDATE tickets
     SET status = ?, status_updated_at = ?, claimed_by_id = ?, claimed_by_name = ?
     WHERE id = ?`,
      [
        "Claimed",
        claimedAt.toISOString(),
        interaction.user.id,
        interaction.user.tag,
        ticketId,
      ]
    );

    await interaction.reply({
      content: `Ticket #${ticketId} has been claimed by ${interaction.user.tag}.`,
    });

    const messages = await channel.messages.fetch({ limit: 10 });
    const botMessage = messages.find(
      (m) => m.author.id === client.user.id && m.embeds.length > 0
    );

    if (botMessage) {
      const oldEmbed = botMessage.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed)
        .spliceFields(2, 1, {
          name: "Status",
          value: "🟡 Claimed",
          inline: true,
        })
        .addFields({
          name: "Claimed By",
          value: `${interaction.user}`,
          inline: true,
        });

      await botMessage.edit({ embeds: [newEmbed] });
    }
  },
};
