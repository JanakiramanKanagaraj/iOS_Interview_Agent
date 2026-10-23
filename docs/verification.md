# Free local version verification — 23 October 2026

## Passed

- Eleven automated tests covering provider isolation, no paid calls in default free mode, same-origin validation, input bounds, transcript semantics and timer behavior.
- Syntax checks for the browser and backend.
- Official Ollama v0.40.9 portable runtime downloaded; qwen3:1.7b model downloaded and verified by Ollama.
- Real CPU inference succeeded after disabling GPU device and KV cache offload with the supplied launcher settings.
- A real local two-turn test returned a follow-up specifically about the sample candidate's exponential-backoff delay strategy. Follow-up latency was approximately 1.7 seconds in that run; first model response included load time and took approximately 7.2 seconds.
- Real local review returned nonempty personalized text (approximately 3,054 characters) in about 24.7 seconds. These are observations, not guaranteed response times or a comprehensive correctness assessment.
- Initial model-generated openings sometimes invented ownership. The opening is now a bounded curated greeting; subsequent turns and reviews are actual local model generation.

## Device checks

Browser speech synthesis and microphone recognition depend on browser support and permission. The application can be exercised with typed answers without faking a voice transcript. The full microphone recognition of the candidate's actual speech and subjective voice quality still need candidate verification. Device speech animation is approximate, not phoneme-level lip sync.

## Constraints

The tested Mac reports 8 GB memory. The small local model may make technical mistakes. Text context is bounded by a 4,096-token local inference window; lengthy sessions can lose earlier details despite the full transcript remaining saved in the app. Export long sessions and review them in smaller sections if needed.

The free runtime does not use the configured paid API key. Earlier paid-version HTTP 429 failures do not block local inference.

## Browser check

The browser started a free session, displayed a real generated follow-up for a typed synthetic playback-recovery answer, and fired device-speech output. The test session was cleared before handoff. Actual candidate microphone transcription remains to be checked during the first real session.
