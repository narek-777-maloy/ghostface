import discord
from discord import app_commands
from discord.ext import commands
import database
from utils.permissions import is_admin

class Invites(commands.Cog):
    def __init__(self, bot): self.bot = bot

    @app_commands.command(name="top-invites", description="Топ по приглашениям")
    async def top(self, interaction):
        rows = await database.fetchall("SELECT user_id,count FROM invite_counts ORDER BY count DESC LIMIT 10")
        text = "\n".join(f"**{i}.** <@{uid}> — `{count}`" for i,(uid,count) in enumerate(rows,1)) or "Нет данных."
        await interaction.response.send_message("🏆 **Топ инвайтов**\n" + text)

    @app_commands.command(name="invites", description="Показать инвайты")
    @app_commands.describe(user="Пользователь")
    async def invites(self, interaction, user: discord.Member=None):
        user = user or interaction.user
        row = await database.fetchone("SELECT count FROM invite_counts WHERE user_id=?", (user.id,))
        await interaction.response.send_message(f"📨 {user.mention}: **{row[0] if row else 0}** инвайтов.")

    @app_commands.command(name="add-invites", description="Изменить инвайты")
    @app_commands.describe(user="Пользователь", amount="Добавить или вычесть")
    async def add(self, interaction, user: discord.Member, amount: int):
        if not is_admin(interaction):
            return await interaction.response.send_message("❌ Недостаточно прав.", ephemeral=True)
        row = await database.fetchone("SELECT count FROM invite_counts WHERE user_id=?", (user.id,))
        new = max(0, (row[0] if row else 0) + amount)
        await database.execute("INSERT INTO invite_counts(user_id,count) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET count=?", (user.id,new,new))
        await interaction.response.send_message(f"✅ {user.mention}: **{new}** инвайтов.")

async def setup(bot): await bot.add_cog(Invites(bot))
