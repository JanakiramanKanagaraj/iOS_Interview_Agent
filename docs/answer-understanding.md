# Answer understanding and session memory

The local interviewer still uses one model, selected through Ollama. A structured conversation controller now wraps each generated turn.

## Turn loop

1. Recognize controls such as help, feedback, repeat and topic changes.
2. Keep the current tracked competency active; answer length alone no longer advances a tracked technical round.
3. Build bounded context from the question, answer, JD/resume excerpts and recent learning notes.
4. Ask for a schema-constrained decision: probe, clarify, teach, retry or advance, together with the spoken reply and a tentative interpretation.
5. Constrain evidence choices to actual spans of the submitted answer. Revalidate stored evidence against the transcript on subsequent requests.
6. Reject unsupported evidence, unplanned topic switches, repeated questions, role confusion and selected known factual contradictions. Retry once, then use a guided fallback.
7. Persist up to 24 learning-note entries in browser storage with the session. Assisted answers and help requests are marked; no entry is a verified mastery grade.

Short, checked ownership choices and selected teaching requests use bounded reference responses. These are explicit reference paths, not model-generated reasoning. More advanced reasoning still depends on the model. Structured schema validity does not establish technical accuracy.

## Memory and privacy

The current transcript and memory remain in browser local storage and are included in local transcript exports. Suggested notes show the latest interpretation per concept. Previous completed feedback remains bounded practice context, not evidence of improvement. This release does not add a server database, embeddings or model-weight training.

Runtime diagnostics contain action/status labels and counts, not raw answers or notes. Reset clears current-session memory. Browser cancellation now propagates to an in-flight local model request so an abandoned turn does not intentionally continue generating in the background.

## Model investigation

- Qwen3 4B Instruct remains the selected default.
- Qwen3.5 4B's default Mac build downloaded but failed because Metal GPU access was unavailable in this sandboxed session.
- The explicit CPU-compatible Qwen3.5 2B Q4_K_M build ran. Exploratory responses took roughly 10–32 seconds, but the final HTTP smoke produced an incorrect ObservableObject explanation. A review also confused observation wrappers with class inheritance. It was not promoted as a quality upgrade.
- Development comparisons used the same five scenario types while guards were being revised, so their scores are not a controlled benchmark. Some known-concept responses are reference-generated rather than model-generated.

The five scenarios cover a brief correct answer, a wrong explanation, uncertainty, a possibly misheard HTTP number and a long vague answer. Run `node scripts/evaluate-conversation.mjs MODEL_TAG` to repeat them. Output includes generated, reference and fallback sources; a coarse action check is not a factual-accuracy score.

Sources: [Qwen3.5 model card](https://huggingface.co/Qwen/Qwen3.5-4B), [Ollama model variants](https://ollama.com/library/qwen3.5/tags), [Ollama structured output API](https://docs.ollama.com/capabilities/structured-outputs).

## Remaining limitations

Free browser speech remains turn-based, not full-duplex conversational audio. Model responses and reviews may still contain errors or generic questions. Reference guards cover selected concepts, not all iOS or other-platform knowledge. Longer CPU-generated reviews can take over a minute. No hiring outcome or complete interview realism is guaranteed.
