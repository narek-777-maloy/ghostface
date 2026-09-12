const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'userUpdate',
  async execute(oldUser, newUser, config) {
    const guild = newUser.client.guilds.cache.get(config.guildId);
    if (!guild || !guild.members.cache.has(newUser.id)) return; // логируем только участников нашего сервера

    const changes = [];

    if (oldUser.username !== newUser.username) {
      changes.push(`**Имя пользователя:** \`${oldUser.username}\` → \`${newUser.username}\``);
    }
    if (oldUser.avatar !== newUser.avatar) {
      changes.push('**Аватар изменён**');
    }

    if (!changes.length) return;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🪪 Профиль изменён')
      .setDescription(`${newUser} (${newUser.tag})\n\n${changes.join('\n')}`)
      .setThumbnail(newUser.displayAvatarURL())
      .setTimestamp();

    sendLog(newUser.client, config.logChannelId, embed);
  }
};
