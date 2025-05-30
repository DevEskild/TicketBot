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
    .setName("unclaimticket")
    .setDescription("Unclaim this ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const openCategoryId = client.config.TICKETCAT;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to unclaim tickets.",
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
    const updatedAt = new Date();

    let ticket;
    try {
      ticket = await getTicketById(ticketId);
      if (!ticket) {
        return interaction.reply({
          content: "Could not find ticket data.",
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error("DB error:", err);
      return interaction.reply({
        content: "Error accessing the database.",
        ephemeral: true,
      });
    }

    await channel.setParent(openCategoryId).catch(console.error);
    await channel.permissionOverwrites.set([
      {
        id: interaction.guild.id,
        deny: ["ViewChannel"],
      },
      {
        id: staffRoleId,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
      {
        id: ticket.user_id,
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      },
    ]);

    db.run(
      `UPDATE tickets
       SET status = ?, status_updated_at = ?, claimed_by_id = NULL, claimed_by_name = NULL
       WHERE id = ?`,
      ["Open", updatedAt.toISOString(), ticketId]
    );

    await interaction.reply({
      content: `Ticket #${ticketId} has been unclaimed and moved back to the open queue.`,
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
          value: "🟢 Open",
          inline: true,
        })
        .setFields(
          EmbedBuilder.from(oldEmbed).data.fields.filter(
            (f) => f.name !== "Claimed By"
          )
        );

      await botMessage.edit({ embeds: [newEmbed] });
    }
  },
};
