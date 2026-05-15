# Brownfield Tester App

This is a sample application used to test brownfield integration with Expo modules.

## Structure

- **[expo-app/](expo-app/)** — The React Native / Expo app that serves as the JavaScript source and brownfield artifact builder. See its [README](expo-app/README.md) for build instructions.

- **[integrated/](integrated/)** — Native Android and iOS apps that integrate directly with the monorepo using Expo autolinking. They point their project root to `expo-app/` and resolve modules at build time.

- **[isolated/](isolated/)** — Standalone native Android and iOS apps that consume pre-built brownfield artifacts (Maven / xcframeworks). They are fully self-contained and do not depend on the monorepo at build time. This is the recommended distribution approach.
