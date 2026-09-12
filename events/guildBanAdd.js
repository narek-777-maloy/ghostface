const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'guildBanAdd',
  async execute(ban, config) {
    let reason = 'Не указана';
    let moderator = null;
    try {
      const fetchedLogs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = fetchedLogs.entries.first();
      if (entry && entry.target.id === ban.user.id) {
        if (entry.reason) reason = entry.reason;
        moderator = entry.executor;
      }
    } catch (_) {}

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🔨 Пользователь забанен')
      .setDescription(
        `**${ban.user.tag}**\n` +
        `Причина: ${reason}` +
        (moderator ? `\nМодератор: ${moderator.tag}` : '')
      )
      .setThumbnail(ban.user.displayAvatarURL())
      .setTimestamp();

    sendLog(ban.client, config.logChannelId, embed);
  }
};
