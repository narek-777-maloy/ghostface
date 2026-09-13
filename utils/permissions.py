import discord
from utils.config import load

def is_admin(interaction: discord.Interaction) -> bool:
    if interaction.user.guild_permissions.administrator:
        return True
    allowed = {str(x) for x in load().get("adminRoleIds", [])}
    return any(str(role.id) in allowed for role in getattr(interaction.user, "roles", []))
