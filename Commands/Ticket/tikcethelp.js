const {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tickethelp")
    .setDescription("Show help for all ticket system commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  /**
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const embed = new EmbedBuilder()
      .setTitle("🎟️ Ticket System Commands")
      .setColor("Blue")
      .setDescription(
        "Here is an overview of all available ticket-related commands."
      )
      .addFields(
        {
          name: "/ticketmsg",
          value:
            "Sends a message with the ticket creation button to a specified channel.",
        },
        {
          name: "/claimticket",
          value:
            "Claims the ticket you're in. Moves it to the claimed category and assigns you.",
        },
        {
          name: "/unclaimticket",
          value:
            "Unclaims the current ticket and moves it back to the open queue.",
        },
        {
          name: "/closeticket",
          value:
            "Closes the current ticket. Restricts access to staff and offers reopen/delete options.",
        },
        {
          name: "/ticketaccess add/remove",
          value: "Add or remove a specific user from a ticket channel.",
        },
        {
          name: "/tickethelp",
          value: "Shows this help menu with all ticket commands.",
        }
      )
      .setFooter({ text: "Ticket Bot Help" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
