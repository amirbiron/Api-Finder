import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("keyboards", Path(__file__).resolve().parent.parent / "keyboards.py")
keyboards = importlib.util.module_from_spec(spec)
spec.loader.exec_module(keyboards)


def test_main_menu_keyboard_layout():
    keyboard = keyboards.main_menu_keyboard()
    rows = keyboard.inline_keyboard
    assert len(rows) == 2
    assert len(rows[0]) == 2
    assert rows[0][0].callback_data == "joke"
    assert rows[0][1].callback_data == "quote"
    assert rows[1][0].callback_data == "about"
