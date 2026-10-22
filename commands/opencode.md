---
description: Delegate a task to an OpenCode model (e.g. /opencode grok 4.7 -- add input validation to the signup form)
argument-hint: <model> -- <task>
---

Delegate this to an OpenCode model, following the opencode-delegate skill: $ARGUMENTS

The text before `--` is the model name. If there is no `--`, work out the model name from the text, or leave the model out so OpenCode uses its configured default.

The text after `--` is the task. Pass it to the `opencode-worker` agent essentially verbatim, with the model name and mode (write by default, read-only for reviews and questions). Do not expand it into a long brief: OpenCode restores its own context from engram, Graphiti and codegraph. Add only constraints or a done-when that the task lacks.

When the agent returns, review the git diff, run the relevant tests, and give me a summary. The summary should say which model did the work, what it changed, and your verdict.
