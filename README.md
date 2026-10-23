# Interview Mentor — Free Local iOS Interview Agent

An animated interviewer and supportive mentor powered by a local language model. Interview Mentor opens with a brief curated greeting, then generates follow-ups from your actual answer, uses profile/JD context, discusses Swift code, and produces personalized review. Default free mode never calls a paid AI API.

## Requirements

- Node.js 22 or newer.
- Ollama from https://ollama.com/download.
- A local model: `ollama pull qwen3:1.7b` (approximately 1.4 GB).
- Browser microphone permission and speech-recognition support for voice input. Typing remains available.

## Run

```sh
./scripts/serve-local-model.sh
# In another terminal:
ollama pull qwen3:1.7b
node server.mjs
```

Open http://127.0.0.1:8766. If another local server is using that port, run `PORT=8767 node server.mjs` and use the printed URL. No Node dependencies or API key are needed.

Optional `.env` configuration:

```text
INTERVIEW_PROVIDER=local
OLLAMA_MODEL=qwen3:1.7b
```

Local mode is the default even if OPENAI_API_KEY exists. For a different installed local model, set OLLAMA_MODEL and restart or save the config. Larger models need more memory. The included launcher forces CPU operation and disables GPU KV-cache offload, which was necessary in the tested sandbox. A portable runtime can be supplied with OLLAMA_BIN; custom model storage can be set with OLLAMA_MODELS. The original paid Realtime backend remains in source history and as an explicit opt-in backend; the current browser experience uses `/api/chat` with Ollama.

## Start a practice

Choose a duration, device voice, and interview or coaching style. Keep your additional background, upload a résumé (PDF/DOCX/TXT, up to 5 MB), and paste the JD. Check and edit the extracted résumé text before starting. The original file is parsed in memory and is not saved; extracted text is kept in browser localStorage with your session. Scanned PDFs need OCR text pasted into the preview. For PDF parsing, install `pdfplumber` in Python and set `PDF_PYTHON` if needed; DOCX/TXT use Python’s standard library. Click **Start free interview**. Interview Mentor asks an opening question and listens after speaking. A short silence submits a recognized answer to the local AI automatically; **I'm done speaking** can finish a turn earlier. Correct recognition errors by typing a clarification. **Stop speaking / listen** interrupts Interview Mentor and returns the microphone to you. Speech recognition pauses while Interview Mentor speaks, so full-duplex voice interruption is not claimed.

Use “hint” or “teach,” or the matching controls. Pause stops recognition, pending generation, speech and the timer. **Reset interview** stops pending work, clears background, résumé upload/text, JD, code and current answers, resets the timer, and returns to the expanded setup form. Voice, duration and previous reviews are kept. Fill in the new candidate details before starting. Finish stops the microphone, then requests an actual transcript-based review. Discuss code through the Swift/design area; code is reasoned about, not executed. The model can make mistakes, especially on advanced iOS topics; ask for reasoning and verify uncertain claims.

## Privacy and cost

Model inference and review run on this Mac through Ollama. There are no paid API calls in default mode. Downloads, computing and electricity still use your own resources. The browser's speech-recognition implementation may process audio through its vendor's online service; speech is not guaranteed offline. Installed device voices supply speech output. Maple is not included.

Transcripts, code and reviews are stored in this browser's localStorage. Download them when useful or clear them with the app control. The server does not write a transcript database or raw audio. Never put secrets in a JD/profile field. The backend binds to loopback, serves only explicit frontend files, validates same-origin writes, bounds input and rate-limits requests. Do not expose this local application publicly without adding authentication.

## Progress

The suggested session duration follows locally completed reviews: 15, then 30 for sessions 2–4, 45 for 5–7, 60 for 8–10, 75 for 11–12, and 90 for 13–14. You can repeat or change a duration. A missed calendar day does not increase difficulty automatically. The app preserves the current transcript and latest 14 review summaries in this browser.

## Checks and documentation

Run `npm test` and `npm run check`. Tests verify no paid-provider routing in free mode, backend validation, transcript semantics, and timer behavior. Mock tests do not establish real model quality or microphone recognition; see [verification](docs/verification.md).

- [Agreed requirements](docs/requirements.md)
- [Two-week process](docs/interview-process.md)
- [Mentor behavior](docs/mentor-prompt.md)
- [Deployment](docs/deployment.md)
- [Roadmap](docs/roadmap.md)

Reminder automations and job applications are separate from this local interview app.

## Interview progression and repetition prevention

The server ranks competencies from the JD first, using resume evidence to ground questions. A curated opening and competency scenarios establish coverage. Local-model follow-ups respond to actual answers, with at most one follow-up before moving to the next competency. Exact and paraphrased repeats are rejected, retried once, and replaced with an unused question if necessary. Saying “next question” or “I already answered this” advances the topic; explicitly asking for a repeat repeats the question. Help requests stay on the current concept.

Dialogue prompts use topic-relevant document excerpts and a bounded recent transcript rather than overflowing the local model’s 4,096-token window. The full transcript stays saved for export. Speech result indices are reconciled so Safari cannot append the same cumulative final result twice. The current competency is displayed above the conversation.

Runtime logs record topic, phase, counts, generation/rejection status and prompt size, without logging document text or answers. Transcript downloads include these flow diagnostics for troubleshooting. This is interview orchestration and prompt improvement, not model-weight fine-tuning.
