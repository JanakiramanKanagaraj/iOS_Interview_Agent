# Deployment

The `web/` directory is a buildless static site. Serve it on HTTPS for deployment. Preserve private access for interview practice unless the owner explicitly requests public access.

The existing Sites registration is tracked separately in the originating workspace. It has not been published: automatic approval review blocked the source workflow's credential-stdin operation. Do not create a replacement Site to work around that block. Resume publication through an approved source upload path.

For other static hosting, publish `web/` as the site root. No build command is needed. Do not put secrets in browser JavaScript. Browser voice availability and microphone recognition require verification on the deployed origin.

GitHub Pages would generally expose the site publicly; do not enable it without an explicit audience decision. This repository deliberately does not include an automatic public deployment workflow.
