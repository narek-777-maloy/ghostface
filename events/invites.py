import discord
from discord.ext import commands
from utils.config import load
from utils.webhooks import send_log
from utils.embeds import log_embed
import database

class InviteTracker(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.cache = {}

    async def refresh(self, guild):
        try:
            invites = await guild.invites()
            self.cache[guild.id] = {i.code: (i.inviter.id if i.inviter else 0, i.uses or 0) for i in invites}
        except (discord.Forbidden, discord.HTTPException):
            self.cache[guild.id] = {}

    @commands.Cog.listener()
    async def on_ready(self):
        for guild in self.bot.guilds:
            await self.refresh(guild)

    @commands.Cog.listener()
    async def on_invite_create(self, invite):
        await self.refresh(invite.guild)

    @commands.Cog.listener()
    async def on_invite_delete(self, invite):
        self.cache.get(invite.guild.id, {}).pop(invite.code, None)

    @commands.Cog.listener()
    async def on_member_join(self, member):
        guild = member.guild
        before = self.cache.get(guild.id, {}).copy()
        await self.refresh(guild)
        after = self.cache.get(guild.id, {})
        inviter_id = None
        for code, (inviter, uses) in after.items():
            old = before.get(code, (inviter, 0))[1]
            if uses > old:
                inviter_id = inviter
                break
        if not inviter_id:
            return
        await database.execute(
            "INSERT INTO invite_counts(user_id,count) VALUES(?,1) "
            "ON CONFLICT(user_id) DO UPDATE SET count=count+1", (inviter_id,))
        cfg = load()
        ch = guild.get_channel(int(cfg["inviteLogChannelId"]))
        if ch:
            e = log_embed("📨 Новый инвайт",
                          f"<@{inviter_id}> пригласил {member.mention}\nВсего: "
                          f"**{(await database.fetchone('SELECT count FROM invite_counts WHERE user_id=?',(inviter_id,)))[0]}**",
                          user=member)
            await send_log(self.bot, ch, e)

async def setup(bot):
    await bot.add_cog(InviteTracker(bot))
