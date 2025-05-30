const {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticketmsg")
    .addChannelOption((options) =>
      options
        .setName("channel")
        .setDescription("Supply the channel you want the message to be sent in")
        .setRequired(true)
    )
    .setDescription("Will respond with a custom message")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  /**
   *
   * @param {ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");

    if (!channel) return;

    const Embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("Create a ticket!")
      .setThumbnail(client.config.LOGO)
      .setDescription(
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
      );

    const createBtn = new ButtonBuilder()
      .setCustomId("createTicket")
      .setLabel("Create a Ticket")
      .setEmoji("📝")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(createBtn);

    await channel.send({ embeds: [Embed], components: [row] });

    interaction.reply({
      content: "Ticket has been created!!",
      ephemeral: true,
    });
  },
};
