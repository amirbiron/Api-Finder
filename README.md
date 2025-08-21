# RenderBot

RenderBot is a playful Telegram bot that delivers random jokes and inspirational quotes.
The bot uses inline buttons for a friendly, command‑free experience.

## Features

- 🎲 **Random Joke** – Get a joke from [official-joke-api.appspot.com](https://official-joke-api.appspot.com).
- 💡 **Inspiration** – Receive a quote from [api.quotable.io](https://api.quotable.io).
- ℹ️ **About** – Learn about the bot.

## Running locally

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Export your bot token:
   ```bash
   export BOT_TOKEN="<your token>"
   ```
3. Start the bot:
   ```bash
   python bot.py
   ```

## Deploying on Render

Use the provided `render.yaml` to deploy as a worker service:

```yaml
services:
  - type: worker
    name: renderbot
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python bot.py
```

Create the service in the Render dashboard and supply the `BOT_TOKEN`
environment variable in the service settings.
