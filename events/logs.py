import discord
from discord.ext import commands
from utils.config import load
from utils.embeds import log_embed
from utils.webhooks import send_log

class Logs(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.cfg = load()

    async def log(self, guild, title, description, user=None):
        channel = guild.get_channel(int(self.cfg["logChannelId"]))
        await send_log(self.bot, channel, log_embed(title, description, user=user))

    @commands.Cog.listener()
    async def on_member_join(self, member):
        await self.log(member.guild, "👋 Участник вошёл", f"{member.mention} присоединился.", member)

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        await self.log(member.guild, "🚪 Участник вышел", f"**{member}** покинул сервер.", member)

    @commands.Cog.listener()
    async def on_message_delete(self, message):
        if message.guild and not message.author.bot:
            await self.log(message.guild, "🗑️ Сообщение удалено",
                           f"Автор: {message.author.mention}\nКанал: {message.channel.mention}\n"
                           f"{message.content[:1500] or '*без текста*'}", message.author)

    @commands.Cog.listener()
    async def on_bulk_message_delete(self, messages):
        if not messages: return
        guild = messages[0].guild
        if guild:
            await self.log(guild, "🗑️ Массовое удаление",
                           f"Канал: {messages[0].channel.mention}\nУдалено: **{len(messages)}** сообщений.")

    @commands.Cog.listener()
    async def on_message_edit(self, before, after):
        if before.guild and not before.author.bot and before.content != after.content:
            await self.log(before.guild, "✏️ Сообщение изменено",
                           f"Автор: {before.author.mention}\nКанал: {before.channel.mention}\n"
                           f"**До:** {before.content[:700]}\n**После:** {after.content[:700]}", before.author)

    @commands.Cog.listener()
    async def on_member_update(self, before, after):
        if before.nick != after.nick:
            await self.log(after.guild, "📝 Никнейм изменён",
                           f"**До:** {before.nick}\n**После:** {after.nick}", after)
        if before.roles != after.roles:
            old = {r.id for r in before.roles}; new = {r.id for r in after.roles}
            added = [r.mention for r in after.roles if r.id in new-old]
            removed = [r.mention for r in before.roles if r.id in old-new]
            if added or removed:
                await self.log(after.guild, "🎭 Роли изменены",
                               f"Добавлены: {', '.join(added) or '—'}\nУдалены: {', '.join(removed) or '—'}", after)
        if before.timed_out_until != after.timed_out_until:
            await self.log(after.guild, "⏱️ Timeout изменён",
                           f"Новое значение: `{after.timed_out_until}`", after)

    @commands.Cog.listener()
    async def on_user_update(self, before, after):
        if before.name != after.name or before.display_avatar.key != after.display_avatar.key:
            guilds = [g for g in self.bot.guilds if g.get_member(after.id)]
            for guild in guilds:
                await self.log(guild, "👤 Профиль изменён",
                               f"Имя: `{before.name}` → `{after.name}`\nАватар изменён: `{before.display_avatar.key != after.display_avatar.key}`", after)

    @commands.Cog.listener()
    async def on_guild_channel_create(self, channel):
        await self.log(channel.guild, "📁 Канал создан", f"{channel.mention} (`{channel.id}`)")

    @commands.Cog.listener()
    async def on_guild_channel_delete(self, channel):
        await self.log(channel.guild, "🗑️ Канал удалён", f"**{channel.name}** (`{channel.id}`)")

    @commands.Cog.listener()
    async def on_guild_channel_update(self, before, after):
        if before.name != after.name:
            await self.log(after.guild, "📁 Канал изменён", f"`{before.name}` → `{after.name}`")

    @commands.Cog.listener()
    async def on_guild_role_create(self, role):
        await self.log(role.guild, "🎭 Роль создана", f"{role.mention} (`{role.id}`)")

    @commands.Cog.listener()
    async def on_guild_role_delete(self, role):
        await self.log(role.guild, "🗑️ Роль удалена", f"**{role.name}** (`{role.id}`)")

    @commands.Cog.listener()
    async def on_guild_role_update(self, before, after):
        if before.name != after.name:
            await self.log(after.guild, "🎭 Роль изменена", f"`{before.name}` → `{after.name}`")

    @commands.Cog.listener()
    async def on_voice_state_update(self, member, before, after):
        if before.channel == after.channel: return
        if before.channel is None:
            text = f"{member.mention} вошёл в {after.channel.mention}"
        elif after.channel is None:
            text = f"{member.mention} вышел из {before.channel.mention}"
        else:
            text = f"{member.mention}: {before.channel.mention} → {after.channel.mention}"
        await self.log(member.guild, "🔊 Голосовой канал", text, member)

async def setup(bot):
    await bot.add_cog(Logs(bot))
