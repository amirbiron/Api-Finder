"""WeatherBot: provide current weather for major Israeli cities."""

from __future__ import annotations

import os
from typing import Dict

import httpx
from telegram import Update
from telegram.ext import Application, CallbackQueryHandler, CommandHandler, ContextTypes

from keyboards import main_menu_keyboard


WEATHER_API = "https://api.open-meteo.com/v1/forecast"

CITIES: Dict[str, Dict[str, float | str]] = {
    "city_tel_aviv": {"name": "תל אביב", "lat": 32.0853, "lon": 34.7818},
    "city_jerusalem": {"name": "ירושלים", "lat": 31.7683, "lon": 35.2137},
    "city_haifa": {"name": "חיפה", "lat": 32.794, "lon": 34.9896},
}


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send the main menu with Hebrew greeting."""
    await update.message.reply_text(
        "שלום! אני בוט מזג האוויר. בחר עיר:",
        reply_markup=main_menu_keyboard(),
    )


async def handle_button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """React to button presses."""
    query = update.callback_query
    await query.answer()
    choice = query.data

    if choice in CITIES:
        city = CITIES[choice]
        params = {
            "latitude": city["lat"],
            "longitude": city["lon"],
            "current_weather": True,
            "timezone": "auto",
        }
        try:
            resp = httpx.get(WEATHER_API, params=params, timeout=10.0)
            resp.raise_for_status()
            weather = resp.json()["current_weather"]
            temp = weather["temperature"]
            wind = weather["windspeed"]
            text = f"מזג האוויר ב{city['name']}: {temp}°C, רוח {wind} קמ""ש"
        except Exception:
            text = "מצטערים, לא ניתן לקבל מידע כרגע."
        await query.edit_message_text(text, reply_markup=main_menu_keyboard())
    elif choice == "about":
        await query.edit_message_text(
            "הבוט מציג טמפרטורה נוכחית בערים מרכזיות בישראל.",
            reply_markup=main_menu_keyboard(),
        )


def main() -> None:
    token = os.environ["BOT_TOKEN"]
    app = Application.builder().token(token).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(handle_button))
    app.run_polling()


if __name__ == "__main__":
    main()

