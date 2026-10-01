# GPT-Live Session Service

Small Node/Express service that exchanges a browser WebRTC SDP offer for a
GPT-Live session and SDP answer. The OpenAI API key remains on this trusted
server.

## Run locally

1. Install dependencies:

   ```sh
   npm install
   ```

2. Set the environment variables shown in `.env.example` in your shell or
   deployment environment. This service does not load `.env` files itself.

3. Start the service:

   ```sh
   npm start
   ```

The service exposes:

- `GET /health`
- `POST /api/gpt-live/session` with `Content-Type: application/sdp` and the
  browser SDP offer as the raw request body

## Deploy on Render

Create a Render Web Service with these settings:

- Root Directory: `gpt-live-session-service`
- Environment: Node
- Build Command: `npm install`
- Start Command: `npm start`

Set these environment variables in Render:

```text
OPENAI_API_KEY=<secret>
ALLOWED_ORIGIN=https://assistant-dev.educationforall.ai
```

Render supplies `PORT` automatically. The service defaults to port `3000` when
`PORT` is not set.

## Future frontend configuration

After deployment, configure the Create React App frontend with a service URL:

```text
REACT_APP_GPT_LIVE_SESSION_URL=https://<render-service>/api/gpt-live/session
```

Then update `useGptLiveVoice.ts` to replace:

```js
fetch("/api/gpt-live/session", ...)
```

with:

```js
fetch(process.env.REACT_APP_GPT_LIVE_SESSION_URL!, ...)
```

Do not hardcode the Render hostname into the React application.
