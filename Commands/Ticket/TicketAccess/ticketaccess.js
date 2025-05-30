const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketaccess")
    .setDescription("Add or remove users from a ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Add a user to the ticket")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to add").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a user from the ticket")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("User to remove").setRequired(true)
        )
    ),
};
