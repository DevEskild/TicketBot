const { ChatInputCommandInteraction } = require("discord.js");

module.exports = {
  subCommand: "ticketaccess.remove",

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const staffRoleId = client.config.STAFF;
    const member = await interaction.guild.members.fetch(interaction.user.id);

    if (!member.roles.cache.has(staffRoleId)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
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

    const user = interaction.options.getUser("user");

    try {
      await channel.permissionOverwrites.edit(user.id, {
        ViewChannel: false,
      });

      await interaction.reply({
        content: `${user.tag} has been removed from the ticket.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("TicketAccess Remove Error:", err);
      return interaction.reply({
        content: "Failed to remove user. Check bot permissions.",
        ephemeral: true,
      });
    }
  },
};
