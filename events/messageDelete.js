const { EmbedBuilder } = require('discord.js');
const { sendLog } = require('../utils/webhookLogger');

module.exports = {
  name: 'messageDelete',
  async execute(message, config) {
    if (!message.guild || message.author?.bot) return;

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🗑️ Сообщение удалено')
      .addFields(
        { name: 'Автор', value: `${message.author ? message.author.tag : 'Неизвестно'}`, inline: true },
        { name: 'Канал', value: `${message.channel}`, inline: true },
        { name: 'Содержимое', value: message.content?.length ? message.content.slice(0, 1000) : '*вложение / пусто*' }
      )
      .setTimestamp();

    sendLog(message.client, config.logChannelId, embed);
  }
};
