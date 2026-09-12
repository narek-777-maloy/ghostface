const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, config) {
    if (newMember.guild.id !== config.guildId) return;

    const changes = [];

    if (oldMember.nickname !== newMember.nickname) {
      changes.push(
        `**Никнейм:** \`${oldMember.nickname || oldMember.user.username}\` → \`${newMember.nickname || newMember.user.username}\``
      );
    }

    const oldRoles = oldMember.roles.cache;
    const newRoles = newMember.roles.cache;
    const addedRoles = newRoles.filter(r => !oldRoles.has(r.id));
    const removedRoles = oldRoles.filter(r => !newRoles.has(r.id));

    if (addedRoles.size) changes.push(`**Выданы роли:** ${addedRoles.map(r => r.toString()).join(', ')}`);
    if (removedRoles.size) changes.push(`**Сняты роли:** ${removedRoles.map(r => r.toString()).join(', ')}`);

    if (oldMember.communicationDisabledUntilTimestamp !== newMember.communicationDisabledUntilTimestamp) {
      if (newMember.communicationDisabledUntilTimestamp && newMember.communicationDisabledUntilTimestamp > Date.now()) {
        changes.push(`**Тайм-аут выдан до:** <t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:F>`);
      } else {
        changes.push('**Тайм-аут снят/истёк**');
      }
    }

    if (!changes.length) return;

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('👤 Участник изменён')
      .setDescription(`${newMember} (${newMember.user.tag})\n\n${changes.join('\n')}`)
      .setThumbnail(newMember.user.displayAvatarURL())
      .setTimestamp();

    sendLog(newMember.client, config.logChannelId, embed);
  }
};
