const { EmbedBuilder } = require('discord.js');
const { handleMemberLeave } = require('../utils/inviteTracker');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, config) {
    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('📤 Участник вышел')
      .setDescription(`${member.user} (${member.user.tag})\nВсего участников: **${member.guild.memberCount}**`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    sendLog(member.client, config.logChannelId, embed);

    await handleMemberLeave(member, config);
  }
};
