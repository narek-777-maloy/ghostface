import discord

def log_embed(title, description, *, user=None):
    e = discord.Embed(title=title, description=description,
                      timestamp=discord.utils.utcnow())
    if user:
        e.set_footer(text=f"{user} • ID: {user.id}")
    return e
