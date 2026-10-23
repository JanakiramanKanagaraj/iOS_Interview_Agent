# Alex — Senior iOS Interview Room

An animated, voice-enabled practice room for a senior iOS/tvOS interview preparation sprint.

## Run locally

Requires Python 3 and a browser:

```sh
python3 -m http.server 8765 --bind 127.0.0.1 --directory web
```

Open http://127.0.0.1:8765. Select **Voice & preview**, choose an installed English voice, preview it, and start the trial. Click **Speak answer** to request microphone access. Review the transcript before submitting; speech recognition can mishear technical terms. Typing is also supported.

## Implemented

- Animated SVG interviewer with speaking and listening states.
- Device text-to-speech, voice preview and adjustable speaking speed.
- Browser speech recognition, explicit microphone activation, editable transcripts.
- Guided questions, fixed follow-ups, hints, skip and repeat.
- Session lengths from 15 to 90 minutes, pause/resume, and time-based completion.
- Local session persistence and transcript download/copy.
- Study notes after the practice; no fabricated automatic grades.

## Current limits

The question flow is guided, not a model-driven conversation. Personalized evaluation currently requires sharing the exported transcript with a mentor in chat. Dynamic JD analysis, automatic answer correction, cloud neural speech, and application tracking are not implemented. Maple is a ChatGPT voice and is not available through browser speech synthesis. Voice quality depends on installed device voices.

Microphone recognition is not supported in every browser. Audio may be processed by the browser vendor's online recognition service. App transcripts are stored in localStorage on the current browser; there is no server transcript database. The app does not store raw audio. Avoid sharing confidential employer information.

## Preparation process

See [14-day practice plan](docs/interview-process.md), [mentor behavior](docs/mentor-prompt.md), [roadmap](docs/roadmap.md), and [deployment](docs/deployment.md).

## Verification

Browser checks completed for interview start and speech start event, typed-answer submission, follow-up display, pause, review summary, and voice selection. Actual microphone transcription and subjective voice quality need device verification. Check JavaScript syntax with `node --check web/app.js`.

No application, email, or recruiter message is sent by this app. Reminder automation is configured separately in the originating chat, not by this repository.
