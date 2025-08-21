import os
import httpx
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes
from keyboards import main_menu_keyboard


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send the main menu with inline buttons."""
    await update.message.reply_text(
        "Hi! I'm RenderBot. Choose an option:",
        reply_markup=main_menu_keyboard(),
    )


async def handle_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """React to button presses."""
    query = update.callback_query
    await query.answer()
    choice = query.data

    if choice == "joke":
        resp = httpx.get("https://official-joke-api.appspot.com/jokes/random", timeout=10.0)
        data = resp.json()
        await query.edit_message_text(f"{data['setup']}\n\n{data['punchline']}")
    elif choice == "quote":
        resp = httpx.get("https://api.quotable.io/random", timeout=10.0)
        data = resp.json()
        await query.edit_message_text(f"“{data['content']}”\n— {data['author']}")
    elif choice == "about":
        await query.edit_message_text("RenderBot delivers random jokes and quotes.\nBuilt with love.")


def main() -> None:
    token = os.environ["BOT_TOKEN"]
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_button))
    app.run_polling()


if __name__ == "__main__":
    main()
