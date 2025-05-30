const {
  ChannelType,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const db = require("../../db"); // path to db.js

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton() || interaction.customId !== "createTicket")
      return;

    const staffRole = client.config.STAFF;
    const ticketCategory = client.config.TICKETCAT;
    const user = interaction.user;
    const createdAt = new Date();

    // Insert ticket into database
    db.run(
      `INSERT INTO tickets (user_id, user_name, created_at, status, status_updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user.id,
        user.tag,
        createdAt.toISOString(),
        "Open",
        createdAt.toISOString(),
      ],
      async function (err) {
        if (err) {
          console.error("DB Error:", err);
          return interaction.reply({
            content: "Something went wrong creating your ticket.",
            ephemeral: true,
          });
        }

        const ticketId = this.lastID;
        const member = await interaction.guild.members.fetch(user.id);
        const nickname = member.nickname || user.username;
        const cleanName = nickname
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .substring(0, 20); // sanitize and shorten
        const channelName = `ticket-${cleanName}-${ticketId}`;

        // Create the channel
        interaction.guild.channels
          .create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: ticketCategory,
            permissionOverwrites: [
              {
                id: interaction.guild.id,
                deny: [PermissionsBitField.Flags.ViewChannel],
              },
              {
                id: user.id,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
              {
                id: staffRole,
                allow: [
                  PermissionsBitField.Flags.ViewChannel,
                  PermissionsBitField.Flags.SendMessages,
                  PermissionsBitField.Flags.ReadMessageHistory,
                ],
              },
            ],
          })
          .then(async (channel) => {
            await interaction.reply({
              content: `Ticket #${ticketId} created: <#${channel.id}>`,
              ephemeral: true,
            });

            const embed = new EmbedBuilder()
              .setTitle(`Ticket #${ticketId}`)
              .setColor("Green")
              .addFields(
                {
                  name: "Created By",
                  value: `${user} (${user.id})`,
                  inline: true,
                },
                {
                  name: "Created At",
                  value: `<t:${Math.floor(createdAt.getTime() / 1000)}:F>`,
                  inline: true,
                },
                { name: "Status", value: "🟢 Open", inline: true }
              )
              .setFooter({ text: `Ticket for ${user.tag}` });

            await channel.send({
              content: `${user} | <@&${staffRole}>`,
              embeds: [embed],
            });
          })
          .catch(console.error);
      }
    );
  },
};
