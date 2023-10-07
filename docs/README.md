# Documentation for Callegram Mini App

## Table of contents

- [Introduction](#introduction)
- [Requirements](#requirements)
- [Installation](#installation)
- [Bot Setup Part 1](#bot-setup-part-1)
- [Web App Setup](#web-app-setup)
- [Backend Setup](#backend-setup)
- [Bot Setup Part 2](#bot-setup-part-2)

## Introduction

Callegram is a mini app that allows users to schedule and manage calls. It is built using vanilla html+css+js for the frontend, and fastapi+postgresql for the backend. Both components are dockerized and can be deployed using docker or docker-compose.

## Requirements

Minimal requirements for running the app:

- docker

If you want to access the app from outside your local network, you will need:

- ngrok (for frontend)
- npm
- localtunnel npm package

## Installation

1. Clone the repository (or download the repository from github as archive) and cd into it:

```bash
git clone https://github.com/arterialist/Callegram.git
cd Callegram
```

2. Install Docker following the instructions [here](https://docs.docker.com/engine/install/) according to your OS.

### Remote setup (optional)

If you want to access the app from outside your local network, you will need to install ngrok and localtunnel npm package.

1. Install ngrok following the instructions [here](https://ngrok.com/download) according to your OS.

2. Install npm following the instructions [here](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) according to your OS.

3. Install localtunnel npm package:

```bash
npm install -g localtunnel
```

## Bot Setup Part 1

1. Pick the Telegram server - main or test. [How to access the test server](https://core.telegram.org/bots/webapps#testing-mini-apps).
2. Create a new bot using the [BotFather](https://t.me/botfather) and copy the token, then save it somewhere.

## Web App Setup

1. Build the frontend docker image:

```bash
cd webapp
docker build -t webapp:latest .
```

2. Run the frontend docker image:

```bash
docker run -d -p 3000:80 webapp:latest
```

3. If you want to access the app from outside your local network, run ngrok:

```bash
ngrok http 3000
```

## Backend Setup

1. Copy the .env.example file to .env:

```bash
cd backend
cp .env.example .env
```

2. Edit the .env file and fill in the following fields:

- `BOT_TOKEN` - the token you got from the BotFather
- `BOT_USERNAME` - the username of the bot you created without "@"
- `WEB_APP_HOST` - the host of the web app (only if you used ngrok to get external address) - e.g. `https://123456789.ngrok.io`
- ENVIRONMENT - either `prod` or `test` depending on the Telegram server you picked

3. Start the backend docker-compose:

```bash
docker compose up -d --build
```

4. If you want to access the app from outside your local network, run localtunnel:

```bash
lt --port 5000
```

5. If you've ran localtunnel, change the `API_BASE_URL` in the `/webapp/assets/scripts/shared/common.js` file to the url you got from localtunnel **WITHOUT THE TRAILING SLASH**.

6. If you've ran localtunnel, go to the url provided by it and enter your external IP address following the instructions at the bottom of the page.

## Bot Setup Part 2

1. Go to @BotFather and set up the main button
   - Send `/mybots`
   - Select your bot
   - Select `Bot Settings`
   - Select `Menu Button`
   - Configure menu button
   - Enter any name for the button
   - If you're on test server and running the app locally enter http://127.0.0.1:3000 as the menu button link
   - Otherwise, enter your ngrok URL
2. Configure "book" Web App
   - Send `/newapp`
   - select your bot
   - Enter any title
   - Enter any description
   - Upload any image file with 640x360px
   - Send /empty for GIF
   - Send http://127.0.0.1:3000/newEvent or `your_ngrok_url/newEvent` as your `Web App Url`, depending on your environment
   - Send `book` as a short name for the app

And your app now should be fully set up and ready for testing!
