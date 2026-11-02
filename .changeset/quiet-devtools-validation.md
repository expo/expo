---
"@expo/cli": patch
---

Remove the Zod production dependency by using schema-utils for DevTools validation and loading Zod from the optional MCP integration.

Declare `expo-mcp` as an optional peer dependency.
