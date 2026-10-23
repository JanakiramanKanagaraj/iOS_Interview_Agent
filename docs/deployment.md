# Deployment status

The current conversational application needs the Node backend (`server.mjs`) as well as the `web/` files. A static-only deployment does not provide the live interview APIs. The local application binds to 127.0.0.1 and keeps its key in private configuration.

The original Sites project remains registered but unpublished. Its source-credential stdin operation was rejected by automatic approval review. It has not been retried through a bypass or replaced with another Site. A future Sites deployment must migrate to a supported server runtime, supply credentials as server-side secrets and preserve private access. Do not publish the old scripted static app as if it were this conversational version.

GitHub contains the application code and documentation, without private configuration or interview transcripts. GitHub Pages cannot run this Node backend. A hosted release still requires authenticated visitor access, secure server runtime configuration, and deployment verification.
