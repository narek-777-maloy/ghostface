const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'roleCreate',
  async execute(role, config) {
    if (role.guild.id !== config.guildId) return;

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🏷️ Роль создана')
      .setDescription(`${role} (\`${role.name}\`)`)
      .setTimestamp();

    sendLog(role.client, config.logChannelId, embed);
  }
};
