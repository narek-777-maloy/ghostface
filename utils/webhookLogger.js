const { WebhookClient } = require('discord.js');

// Кэш вебхуков по ID канала, чтобы не создавать новый при каждом логе
const webhookCache = new Map();

async function getOrCreateWebhook(channel, client) {
  if (webhookCache.has(channel.id)) return webhookCache.get(channel.id);

  try {
    const webhooks = await channel.fetchWebhooks();
    let webhook = webhooks.find(wh => wh.owner?.id === client.user.id && wh.token);

    if (!webhook) {
      webhook = await channel.createWebhook({
        name: 'Логи',
        avatar: client.user.displayAvatarURL()
      });
    }

    const webhookClient = new WebhookClient({ id: webhook.id, token: webhook.token });
    webhookCache.set(channel.id, webhookClient);
    return webhookClient;
  } catch (err) {
    console.error(`⚠️ Не удалось получить/создать вебхук в канале ${channel.id} (нужно право "Управление вебхуками"):`, err.message);
    return null;
  }
}

// Отправляет embed в указанный канал через вебхук. Если вебхук создать не удалось —
// пробует отправить обычным сообщением от бота, чтобы лог не потерялся.
async function sendLog(client, channelId, embed) {
  if (!channelId) return;
  const channel = client.channels.cache.get(channelId);
  if (!channel) return;

  const webhook = await getOrCreateWebhook(channel, client);

  if (webhook) {
    webhook.send({
      username: 'ghostface | Логи',
      avatarURL: client.user.displayAvatarURL(),
      embeds: [embed]
    }).catch(err => {
      console.error('Ошибка отправки лога через вебхук, пробую обычным сообщением:', err.message);
      channel.send({ embeds: [embed] }).catch(() => {});
    });
  } else {
    channel.send({ embeds: [embed] }).catch(() => {});
  }
}

module.exports = { sendLog };
