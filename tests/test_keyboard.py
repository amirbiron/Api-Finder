"""Tests for the main menu keyboard layout."""

import importlib.util
from pathlib import Path


spec = importlib.util.spec_from_file_location(
    "keyboards", Path(__file__).resolve().parent.parent / "keyboards.py"
)
keyboards = importlib.util.module_from_spec(spec)
spec.loader.exec_module(keyboards)


def _extract(kb):
    """Return a serialisable representation of the keyboard."""
    if hasattr(kb, "inline_keyboard"):
        return [
            [
                {"text": btn.text, "callback_data": btn.callback_data}
                for btn in row
            ]
            for row in kb.inline_keyboard
        ]
    return kb


def test_main_menu_keyboard_layout():
    kb = _extract(keyboards.main_menu_keyboard())
    assert kb == [
        [
            {"text": "תל אביב", "callback_data": "city_tel_aviv"},
            {"text": "ירושלים", "callback_data": "city_jerusalem"},
        ],
        [
            {"text": "חיפה", "callback_data": "city_haifa"},
            {"text": "אודות", "callback_data": "about"},
        ],
    ]

