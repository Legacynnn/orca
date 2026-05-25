---
name: plan-review
description: Use when reviewing a markdown plan file via the Serper "Plan review" trigger. Leave one anchored comment per observation using `serper plan-comment leave`; do NOT reply in chat.
---

# Plan review protocol

You were spawned by the **Plan review** trigger in Serper. The plan markdown is included verbatim in your kickoff message. Your job is to read it and leave anchored comments on specific lines — one tool call per observation. The human reviews each comment individually and accepts the ones they want.

## Rules

1. **One observation per `plan-comment leave` call.** Do not bundle multiple unrelated points into one comment. The human accepts/rejects per comment.
2. **Anchor each comment to the specific lines you are commenting on.** Use `--line-start` and `--line-end` (inclusive). For a single-line comment, set them to the same number.
3. **Do NOT reply in chat.** No "Here is my review" preamble, no chat-mode bullet list, no closing summary. The plan-comment store is your only output channel. The human will read the comments in the editor, not the agent transcript.
4. **Always pass `--harness` and `--model`.** Set `--harness` to your agent name (e.g. `claude`, `codex`, `gemini`, `opencode`) and `--model` to your model id. This shows up as the badge on the comment so the human knows where it came from.
5. **Be specific and short.** A comment should fit a popover — 1-3 sentences. If you have more to say, split it across multiple line-anchored comments.

## Command shape

```
serper plan-comment leave \
  --file <path-from-kickoff-message> \
  --line-start <N> \
  --line-end <M> \
  --body "..." \
  --harness <your-harness> \
  --model <your-model>
```

The `--file` value is the `{{planPath}}` substituted into your kickoff message — pass it through unchanged.

## What to look for

- **Unstated assumptions.** Are there constraints, invariants, or callers the plan glosses over?
- **Scope creep / scope gap.** Does the plan do too much? Too little for the stated goal?
- **Ambiguous steps.** Could two engineers read this and write meaningfully different code?
- **Sequencing.** Is the build order safe — does each step leave the system in a working state?
- **Missing tests / verification.** How will success be verified at each phase?
- **Risk and reversibility.** Anything destructive or hard to undo? Anything that needs a flag/gate?

Skip nitpicks. Focus on things the human would want to know *before* implementation.

## When you have nothing to add

If you genuinely have no observations, exit silently. Do not leave a "looks good" comment.
