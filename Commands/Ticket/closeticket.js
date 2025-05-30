const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const db = require("../../db");
const getTicketById = require("../../Functions/getTicket");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("closeticket")
    .setDescription("Close the current ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const closedCategory = client.config.CLOSEDTICKETS;

    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You don't have permission to close tickets.",
        ephemeral: true,
      });
    }

    const channel = interaction.channel;
    const ticketMatch = channel.name.match(/ticket-(?:.+-)?(\d+)$/);
    if (!ticketMatch) {
      return interaction.reply({
        content: "This command must be used inside a ticket channel.",
        ephemeral: true,
      });
    }

    const ticketId = parseInt(ticketMatch[1]);
    const closedAt = new Date();

    db.get(
      `SELECT user_id FROM tickets WHERE id = ?`,
      [ticketId],
      async (err, row) => {
        if (err || !row) {
          return interaction.reply({
            content: "Could not find ticket data.",
            ephemeral: true,
          });
        }

        await channel.setParent(closedCategory);

        await channel.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: ["ViewChannel"],
          },
          {
            id: staffRoleId,
            allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
          },
        ]);

        db.run(
          `UPDATE tickets SET status = ?, status_updated_at = ? WHERE id = ?`,
          ["Closed", closedAt.toISOString(), ticketId]
        );

        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`reopen_${ticketId}`)
            .setLabel("Reopen Ticket")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`delete_${ticketId}`)
            .setLabel("Delete Ticket")
            .setStyle(ButtonStyle.Danger)
        );

        const embed = new EmbedBuilder()
          .setTitle(`Ticket #${ticketId} Closed`)
          .setColor("Red")
          .setDescription("This ticket has been closed by staff.")
          .addFields({
            name: "Closed At",
            value: `<t:${Math.floor(closedAt.getTime() / 1000)}:F>`,
            inline: false,
          });

        await interaction.reply({ content: "Ticket closed.", ephemeral: true });
        await channel.send({ embeds: [embed], components: [buttonRow] });
      }
    );
  },
};
