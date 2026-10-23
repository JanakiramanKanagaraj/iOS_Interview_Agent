# Agreed requirements

## Purpose

Prepare the candidate for a better senior iOS role through a two-week practice sprint and a focused job hunt. The priority is a functioning interviewer before restarting interviews. A job offer is a goal, not a guaranteed outcome.

## Interview behavior

- Interview Mentor is an animated woman interviewer and supportive mentor.
- Listen to the candidate's full answer, understand it, and respond with relevant follow-ups.
- Ask one question at a time. Avoid a fixed questionnaire presented as conversation. A short curated opening is allowed; subsequent follow-ups must be generated from actual answers.
- Teach simply and invite a retry when the candidate is unsure; do not shame them.
- Clarify apparent transcription errors rather than treating them as factual claims.
- Cover Swift, UIKit/SwiftUI, concurrency, debugging, testing, architecture, DSA in Swift, mobile system design, project ownership, and leadership over successive sessions.
- Keep additional background, candidate résumé upload, and pasted JD as separate fields. Use all three to choose questions and difficulty; distinguish candidate evidence from JD requirements.
- Correct actual mistakes after the interview (or during coaching mode), with examples and at most three next actions.
- Discuss code honestly; do not claim code was run.

## Timing

Daily practice was requested for 2 PM India time, adjustable around real interviews and work. Initial trial was 15 minutes. Completed sessions should progress through 15, 30, 45, 60, 75 and 90 minutes, repeating durations when helpful. The app suggests a duration from the count of locally reviewed sessions; the candidate can override it. Reminders are external chat automations, not part of the model runtime.

## Free version

- No paid API calls in default local mode.
- Ollama runs the local language model, including actual answer-based follow-ups and review.
- Browser speech recognition and installed device voices provide voice input/output without an app API charge. Browser recognition can use an online vendor service, so this is not a promise of fully offline speech.
- Free browser speech lacks the paid Realtime voice's seamless full-duplex behavior. A Stop speaking/listen control supports interruption. Do not claim Maple or human-equivalent voice quality.
- The animated mouth follows device speech playback events with an approximate animation, not phoneme-level lip sync.

## Repository and privacy

Keep implementation and process documentation in the user-provided GitHub repository. Never commit keys, raw résumés, personal contact details or interview transcripts. Private runtime files and downloaded model weights remain outside GitHub.

## Readiness gate

Before restarting interview practice, verify a real local model reply, an answer-specific follow-up, and a review. Browser microphone recognition must be checked on the candidate's device; a fallback typing path must remain available. State any unverified behavior accurately.

## Reset behavior update

Reset clears background, résumé upload and extracted text, JD, code, current answers and the timer, then returns to setup. Voice, selected duration, style and past reviews remain available. The mentor uses the temporary name Interview Mentor until the user chooses the application name.
