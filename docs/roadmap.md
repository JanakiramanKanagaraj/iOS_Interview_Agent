# Status and remaining work

## Implemented, pending successful live verification

- Realtime voice conversation over WebRTC with natural AI voice and adaptive follow-ups.
- Server-owned interviewer prompt, profile/JD context, interview/coaching modes.
- Typed clarification and coding/design discussion.
- Pause/mute/end/reconnect, local transcripts and personalized review endpoint.
- Audio-amplitude-driven mouth animation.

## Remaining

- Resolve current provider HTTP 429 and complete a live two-turn test plus review.
- Validate actual voice quality and interruption behavior on the candidate's microphone/browser.
- Authenticated private cloud deployment and secure server secrets.
- Calendar/email integrations after account connection.
- Better review history browsing and progress visualization.
- Automated readiness-driven progression across completed sessions (currently duration is user-selected).
- Code execution sandbox, if requested; current coding review does not execute programs.

Keep provider credentials server-side. Do not commit API keys, résumés, personal contact details or interview transcripts. Do not label generic or unverified behavior as personalized assessment.
