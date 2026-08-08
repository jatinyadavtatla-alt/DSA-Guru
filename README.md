# DSA Guru

A no-nonsense Data Structures & Algorithms instructor chatbot. Ask it a real DSA question and it teaches you properly. Ask it anything else — and it will not be nice about it.

Built with Express and the Gemini API (`gemini-3.6-flash`, Interactions API).

## Features

- Chat interface for Data Structures & Algorithms questions
- Stays in character: polite and clear for DSA questions, rude for off-topic ones
- Remembers conversation context across messages in a session
- Simple, dependency-light Express backend

## Tech stack

- Node.js + Express
- `@google/genai` (Gemini API)
- Vanilla HTML/CSS/JS frontend

## Getting started

1. Clone the repo:
   ```bash
   git clone https://github.com/YOUR_USERNAME/dsa-guru.git
   cd dsa-guru
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and add your own Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Get a key from [Google AI Studio](https://aistudio.google.com/apikey).

4. Run the server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser.

## Environment variables

| Variable   | Description                          |
|------------|---------------------------------------|
| `GoogleAPI`| Your Gemini API key                   |
| `PORT`     | Port to run the server on (default 3000) |

## Deployment

This app can be deployed to Render, Railway, or Fly.io as a standard Node server. A `vercel.json` is included for Vercel deployment as well, though note that in-memory conversation history may not persist reliably across Vercel's serverless function instances.

Set the `GoogleAPI` environment variable in your host's dashboard — never commit your real key to this repo.

## License

ISC