# Samantha — Conversational iOS Interviewer

A live voice interview system with an animated interviewer, adaptive follow-ups, JD context, coding discussion, and personalized review. It uses OpenAI Realtime over WebRTC, not a scripted question queue or browser text-to-speech.

## Start locally

Requires Node.js 22 or newer. No dependency installation is needed.

1. Copy `.env.example` to `.env` in this repository.
2. Put an API key in `OPENAI_API_KEY`. Never commit the real `.env` file or paste a key into the browser/chat. API billing and model access must be available.
3. Run `npm start` (or `node server.mjs`).
4. Open http://127.0.0.1:8766.
5. Choose duration, voice, interview/coaching mode; optionally edit your profile and paste a JD.
6. Click **Connect & start interview** and allow the microphone.

For a private configuration outside the repository, use `node server.mjs --config=/absolute/path/to/private.env`. The server reloads configuration values for each API request. The default `.env` path is the repository root. A locally installed bundled Node executable can replace `node` where Node is not on PATH.

## Conversation

Speak naturally; no answer-submission clicks are needed. Samantha hears audio through the Realtime session, responds to the answer, and asks one follow-up at a time. Low-eagerness semantic voice activity detection allows thinking pauses. Interrupt by speaking or pressing **Stop speaking**. Say “hint” or “teach,” or use the matching controls. Use **Pause** to stop microphone transmission, assistant output and the timer; **Resume** continues. Explicit spoken pause/end commands are also recognized from completed transcripts.

Use the coding area to share Swift or design notes. Code is discussed by the model and is not executed. A typed clarification can correct a misheard word. Both interview and teaching styles are supported.

**Finish & review** closes the peer connection and microphone, then asks the review model to assess the actual transcript and code. It provides strengths, corrections, examples, a retry question and practice priorities. Reviews can be wrong; question uncertain corrections. No fabricated scores or hiring decisions are produced by application logic.

## Voices

Samantha is the persona. Marin is the default natural AI voice; Cedar, Coral, Sage and Shimmer are alternatives. Maple is not offered by this API integration. Voice selection applies before connecting.

## Session history and longer interviews

Session data and the latest 14 review summaries are saved in this browser's localStorage. Download your transcript/review for a durable record. Clear local data through the app when desired. The API's single Realtime connection lasts at most 60 minutes; the app stops at 55 minutes and offers an explicit reconnect with preserved context/time for longer sessions. Network failures also stop the microphone and preserve the transcript. Reconnect needs an explicit click. The preparation schedule is in [the process document](docs/interview-process.md).

## Privacy and boundaries

The long-lived API key is used only by the server. Browser negotiation receives SDP, not the key. Microphone capture starts after Connect and stops on failure, Finish, or page departure. Audio streams to OpenAI; text/profile/JD/code are sent for session context and review. No raw audio or transcript database is written by the server. Review requests set `store: false`; this does not replace the provider's API data retention policy. Browser localStorage is readable by anyone with access to the same browser profile.

The server binds only to 127.0.0.1, validates Host and same-origin writes, caps input, and rate-limits API requests. It serves an explicit allowlist of frontend files; it cannot serve `.env` or source files. It is a private local application, not an authenticated public hosting service. Before any hosted release, add visitor authentication and server-side API configuration. Never deploy the long-lived key in static JavaScript or GitHub Pages.

## Validation

Run `npm test` and `npm run check`. Integration tests mock the provider to verify request shaping, secrets, errors and transcript semantics; mocked tests do not establish successful live voice behavior. Current live verification and account blockers are recorded in [verification](docs/verification.md).

## Documentation

- [Two-week interview process](docs/interview-process.md)
- [Mentor behavior](docs/mentor-prompt.md)
- [Deployment status](docs/deployment.md)
- [Roadmap](docs/roadmap.md)

Email/calendar reminders remain separate from this application. No application or recruiter message is sent by it.
