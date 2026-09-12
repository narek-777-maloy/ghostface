const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'roleUpdate',
  async execute(oldRole, newRole, config) {
    if (newRole.guild.id !== config.guildId) return;

    const changes = [];
    if (oldRole.name !== newRole.name) changes.push(`**Название:** \`${oldRole.name}\` → \`${newRole.name}\``);
    if (oldRole.hexColor !== newRole.hexColor) changes.push(`**Цвет:** \`${oldRole.hexColor}\` → \`${newRole.hexColor}\``);
    if (oldRole.permissions.bitfield !== newRole.permissions.bitfield) changes.push('**Права роли изменены**');

    if (!changes.length) return;

    const embed = new EmbedBuilder()
      .setColor(0xFEE75C)
      .setTitle('🏷️ Роль изменена')
      .setDescription(`${newRole}\n\n${changes.join('\n')}`)
      .setTimestamp();

    sendLog(newRole.client, config.logChannelId, embed);
  }
};
