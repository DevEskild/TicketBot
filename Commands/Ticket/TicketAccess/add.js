const {
  ChatInputCommandInteraction,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  subCommand: "ticketaccess.add",

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
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
      });

      await interaction.reply({
        content: `${user.tag} has been added to the ticket.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error("TicketAccess Add Error:", err);
      return interaction.reply({
        content: "Failed to add user. Check bot permissions.",
        ephemeral: true,
      });
    }
  },
};
