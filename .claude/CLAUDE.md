## Error messages

When writing error messages, consider explaining what, why, and how:

- **What:** clearly state what failed.
- **Why:** explain the likely cause at the user's level of abstraction, not just the symptom.
- **How:** tell the user what to do next, such as a fix, workaround, debugging step, or when to contact support. The user is usually a developer.

Be specific, calm, and actionable. Do not stop at the symptom. Even when the exact fix is unknown, always provide a useful next step. Include diagnostic details only when they help troubleshooting, and label them clearly.

Example error message:
The JavaScript bundler couldn't bundle your code because it depends on a Node.js native addon (node_modules/example/example.node). Use a different package fully implemented in JavaScript, or see https://metrobundler.dev/docs/resolution/ if this package already provides one and the bundler may not be configured to resolve it.
