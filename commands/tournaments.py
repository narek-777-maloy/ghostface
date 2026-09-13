import discord
from discord import app_commands
from discord.ext import commands
import database
from utils.permissions import is_admin

class TournamentModal(discord.ui.Modal,title="Запись на турнир"):
    nick=discord.ui.TextInput(label="Игровой ник",max_length=100)
    server=discord.ui.TextInput(label="ID / сервер",max_length=100)
    async def on_submit(self,interaction):
        row=await database.fetchone("SELECT open FROM tournaments WHERE channel_id=?",(interaction.channel.id,))
        if not row or not row[0]: return await interaction.response.send_message("🔒 Запись закрыта.",ephemeral=True)
        await database.execute("INSERT OR REPLACE INTO tournament_players VALUES(?,?,?,?)",
                               (interaction.channel.id,interaction.user.id,self.nick.value,self.server.value))
        await interaction.response.send_message("🏆 Ты записан!",ephemeral=True)
        await self.update(interaction)
    async def update(self,interaction):
        row=await database.fetchone("SELECT message_id FROM tournaments WHERE channel_id=?",(interaction.channel.id,))
        if row and row[0]:
            msg=await interaction.channel.fetch_message(row[0])
            count=(await database.fetchone("SELECT COUNT(*) FROM tournament_players WHERE channel_id=?",(interaction.channel.id,)))[0]
            e=msg.embeds[0]; e.set_field_at(0,name="Участников",value=str(count)); await msg.edit(embed=e)

class TournamentView(discord.ui.View):
    def __init__(self): super().__init__(timeout=None)
    @discord.ui.button(label="Записаться",style=discord.ButtonStyle.success,emoji="🏆",custom_id="ghostface:tournament_join")
    async def join(self,interaction,button): await interaction.response.send_modal(TournamentModal())

class Tournaments(commands.Cog):
    def __init__(self,bot): self.bot=bot
    @app_commands.command(name="tournament-start",description="Открыть запись")
    async def start(self,interaction):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        e=discord.Embed(title="🏆 Запись на турнир",description="Нажмите кнопку ниже.",color=discord.Color.blurple())
        e.add_field(name="Участников",value="0")
        await interaction.response.send_message(embed=e,view=TournamentView())
        msg=await interaction.original_response()
        await database.execute("INSERT OR REPLACE INTO tournaments(channel_id,message_id,open) VALUES(?,?,1)",(interaction.channel.id,msg.id))

    @app_commands.command(name="tournament-list",description="Список участников")
    async def list_players(self,interaction):
        rows=await database.fetchall("SELECT user_id,nickname,server FROM tournament_players WHERE channel_id=?",(interaction.channel.id,))
        text="\n".join(f"<@{u}> — `{n}` / `{s}`" for u,n,s in rows) or "Пока никого нет."
        await interaction.response.send_message("🏆 **Участники:**\n"+text,ephemeral=True)

    @app_commands.command(name="tournament-close",description="Закрыть запись")
    async def close(self,interaction):
        if not is_admin(interaction): return await interaction.response.send_message("❌ Недостаточно прав.",ephemeral=True)
        await database.execute("UPDATE tournaments SET open=0 WHERE channel_id=?",(interaction.channel.id,))
        await interaction.response.send_message("🔒 Запись закрыта.")

async def setup(bot): await bot.add_cog(Tournaments(bot))
