#!/bin/sh
set -eu
# Conservative CPU settings for sandboxed or memory-constrained Macs.
# OLLAMA_BIN may point to a portable official Ollama executable.
export OLLAMA_NO_CLOUD=1
export OLLAMA_HOST=127.0.0.1:11434
export LLAMA_ARG_DEVICE=none
export LLAMA_ARG_KV_OFFLOAD=0
export LLAMA_ARG_FIT=off
exec "${OLLAMA_BIN:-ollama}" serve
