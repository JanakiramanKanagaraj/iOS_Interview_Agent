# Free local version verification — 23 October 2026

## Passed

- Fifteen automated tests covering provider isolation, no paid calls in default free mode, same-origin validation, input bounds, transcript semantics and timer behavior.
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

## Résumé upload

PDF, DOCX and TXT extraction passed with synthetic documents. Browser file upload populated the editable text preview and left the separate background unchanged. Tests validate file types, cross-origin rejection, extraction errors, and inclusion of background/resume/JD as separate model context. The original file is processed in memory, not saved to the server.

## Repeated-question regression

Added tests for JD priority over resume keyword volume, bounded follow-ups and topic advancement, help and skip requests, exact/paraphrased duplicate rejection, persistent provider repeats, explicit repeats, bounded prompts with long documents/history, and Safari cumulative final-result deduplication. A real local seven-turn smoke test is run separately from browser sessions using synthetic candidate context. Model output is not assumed correct merely because a response succeeds.

Final regression result: 27 automated tests pass. The final real local test produced seven distinct questions across concurrency, UI state, architecture and testing, with topic advancement after at most one follow-up. Accepted generated follow-ups took approximately 1.6–3.2 seconds in that run; a guarded fallback took approximately 3.4 seconds. These are synthetic test observations, not a guarantee of correctness or an evaluation of the candidate. Third-person model commentary is removed from spoken interview turns.

## Conversational rebuild (24 October 2026)

The latest automated suite has 33 passing checks. New coverage exercises introduction → project ownership → technical rounds → coding/design, longer exploration of brief answers, same-topic teaching, concise output checks, and preservation of speech across recognition restarts. A VM-based browser harness verifies manual submission and the optional eight-second silence deadline; this is not a real microphone test.

The smaller Qwen3 1.7B model produced relevant but sometimes generic project questions in a four-turn synthetic check. Initial output also included long scenario formatting, praise and a stale-response question after the same mechanism was explained. Additional validation rejects these detected patterns; it cannot guarantee that every semantic repetition or technical error is caught. Generation is retried once before a guided fallback. The local model remains fallible. No weights were trained or fine-tuned.

Run a reproducible short synthetic conversation with `node scripts/evaluate-interview.mjs MODEL_TAG`. The evaluator calls only the local Ollama service. Synthetic answers do not represent a candidate assessment.

## Selected free model

Qwen3 4B Instruct 2507 Q4_K_M downloaded successfully and completed the same four-turn synthetic conversation as the smaller model on the tested 8 GB Mac using CPU inference. Three generated turns took 12.3, 7.3 and 12.6 seconds; the last included one off-topic rejection and retry. Its project follow-up referenced the generation-identifier mechanism in the answer. This is a limited smoke check, not a benchmark or proof of technical correctness. The default and local configuration now select this model. The smaller Qwen3 1.7B remains available for faster responses. Neither model incurs a local per-request API fee; browser speech may still use its vendor’s service.
