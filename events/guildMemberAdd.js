const { EmbedBuilder } = require('discord.js');
const { handleMemberJoin } = require('../utils/inviteTracker');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, config) {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('📥 Участник зашёл')
      .setDescription(`${member} (${member.user.tag})\nВсего участников: **${member.guild.memberCount}**`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    sendLog(member.client, config.logChannelId, embed);

    // лог инвайтов (отдельный канал + подсчёт)
    await handleMemberJoin(member, config);
  }
};
