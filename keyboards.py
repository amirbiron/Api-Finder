"""Inline keyboards for the WeatherBot."""

from __future__ import annotations

try:  # pragma: no cover - optional dependency
    from telegram import InlineKeyboardButton, InlineKeyboardMarkup
except Exception:  # pragma: no cover - fall back to plain structures
    InlineKeyboardButton = None  # type: ignore
    InlineKeyboardMarkup = None  # type: ignore


def _button(text: str, data: str):
    """Create a button object or plain dict when telegram isn't installed."""
    if InlineKeyboardButton:
        return InlineKeyboardButton(text, callback_data=data)
    return {"text": text, "callback_data": data}


def main_menu_keyboard():
    """Build the main menu keyboard with Hebrew labels."""
    rows = [
        [_button("תל אביב", "city_tel_aviv"), _button("ירושלים", "city_jerusalem")],
        [_button("חיפה", "city_haifa"), _button("אודות", "about")],
    ]
    if InlineKeyboardMarkup:
        return InlineKeyboardMarkup(rows)
    return rows

