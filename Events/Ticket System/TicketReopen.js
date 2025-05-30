const { ButtonInteraction, EmbedBuilder } = require("discord.js");
const db = require("../../db");
const { createTranscript } = require("discord-html-transcripts");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const [action, ticketId] = interaction.customId.split("_");
    const channel = interaction.channel;
    const guild = interaction.guild;

    const getTicketById = require("../../Functions/getTicket");

    if (action === "reopen") {
      let ticket;
      try {
        ticket = await getTicketById(ticketId);
        if (!ticket) {
          return interaction.reply({
            content: "Failed to reopen. Ticket not found.",
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error("DB Error:", err);
        return interaction.reply({
          content: "Database error while reopening the ticket.",
          ephemeral: true,
        });
      }

      const user = await guild.members.fetch(ticket.user_id).catch(() => null);

      await channel.setParent(client.config.TICKETCAT);

      await channel.permissionOverwrites.set([
        {
          id: guild.id,
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
        `UPDATE tickets SET status = ?, status_updated_at = ? WHERE id = ?`,
        ["Open", new Date().toISOString(), ticketId]
      );

      await interaction.update({
        content: `Reopened ticket #${ticketId}.`,
        embeds: [],
        components: [],
      });

      await channel.send(
        `${user ? user : "User"} has been re-added to the ticket.`
      );
    }

    if (action === "delete") {
      const transcriptChannel = guild.channels.cache.get(
        client.config.TRANSCRIPTS
      );
      if (!transcriptChannel) {
        return interaction.reply({
          content: "Transcript log channel not found.",
          ephemeral: true,
        });
      }

      await interaction.update({
        content: "Deleting ticket...",
        embeds: [],
        components: [],
      });

      const transcript = await createTranscript(channel, {
        limit: -1,
        returnBuffer: false,
        fileName: `ticket-${ticketId}.html`,
      });

      await transcriptChannel.send({
        content: `Transcript for ticket #${ticketId}`,
        files: [transcript],
      });

      await channel.delete().catch(console.error);
    }
  },
};
