---
name: Strict TDD
description: Force a red-green-refactor loop before any production code is written.
---

Follow strict test-driven development for this task.

1. Read the existing code to understand the surface area.
2. Write a failing test that captures the next behaviour change. Run it and confirm it fails for the right reason.
3. Write the minimum production code to make the test pass. Don't add features the test does not exercise.
4. Refactor only after the test is green. Keep the test green.
5. Repeat from step 2 until the requested behaviour is fully covered.

Do not skip the failing-test step "just this once". If you cannot articulate the next test, stop and ask for a smaller increment.
