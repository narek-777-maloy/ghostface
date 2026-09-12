const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const db = require('../database');

function buildGiveawayEmbed(giveaway, ended = false) {
  const embed = new EmbedBuilder()
    .setColor(ended ? 0x99AAB5 : 0x5865F2)
    .setTitle(ended ? '🎉 Конкурс завершён!' : '🎉 Конкурс!')
    .setDescription(
      `**Приз:** ${giveaway.prize}\n` +
      `**Победителей:** ${giveaway.winnersCount}\n` +
      `**Организатор:** <@${giveaway.hostId}>\n` +
      `**Участников:** ${giveaway.participants.length}\n\n` +
      (ended
        ? (giveaway.winners && giveaway.winners.length
            ? `**Победители:** ${giveaway.winners.map(id => `<@${id}>`).join(', ')}`
            : 'Никто не участвовал 😔')
        : `Нажмите кнопку ниже, чтобы участвовать!\nЗавершение: <t:${Math.floor(giveaway.endAt / 1000)}:R>`)
    )
    .setTimestamp(ended ? Date.now() : giveaway.endAt);

  return embed;
}

function buildGiveawayRow(disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_join')
      .setLabel('Участвовать 🎉')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled)
  );
}

async function endGiveaway(client, messageId) {
  const giveaway = db.getGiveaway(messageId);
  if (!giveaway || giveaway.ended) return;

  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  if (!channel) {
    db.deleteGiveaway(messageId);
    return;
  }

  const message = await channel.messages.fetch(messageId).catch(() => null);

  const winners = pickWinners(giveaway.participants, giveaway.winnersCount);
  db.updateGiveaway(messageId, { ended: true, winners });

  const updated = db.getGiveaway(messageId);
  const embed = buildGiveawayEmbed(updated, true);
  const row = buildGiveawayRow(true);

  if (message) {
    await message.edit({ embeds: [embed], components: [row] }).catch(() => {});
  }

  if (winners.length) {
    channel.send(
      `🎉 Поздравляем ${winners.map(id => `<@${id}>`).join(', ')}! Вы выиграли **${giveaway.prize}**!`
    ).catch(() => {});
  } else {
    channel.send(`Конкурс на **${giveaway.prize}** завершён, но участников не было.`).catch(() => {});
  }
}

function pickWinners(participants, count) {
  const pool = [...new Set(participants)];
  const winners = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

// Проверяет каждые 15 секунд, не пора ли завершить какой-то конкурс
// (защищает от пропуска дедлайна, если бот был выключен)
function startScheduler(client) {
  setInterval(() => {
    const all = db.getAllGiveaways();
    const now = Date.now();
    for (const [messageId, giveaway] of Object.entries(all)) {
      if (!giveaway.ended && giveaway.endAt <= now) {
        endGiveaway(client, messageId).catch(err => console.error('Ошибка завершения конкурса:', err));
      }
    }
  }, 15000);
}

module.exports = { buildGiveawayEmbed, buildGiveawayRow, endGiveaway, pickWinners, startScheduler };
