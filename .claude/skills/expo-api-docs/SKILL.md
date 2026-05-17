---
name: expo-api-docs
description: Write TSDoc comments for Expo SDK APIs following official conventions. MUST USE when introducing new user-facing TypeScript APIs in expo-* packages - document APIs correctly from the start, not as an afterthought. Also use when improving existing documentation. Covers @platform, @example, @deprecated, @default annotations, third-person declarative style, blockquote notes, and type export patterns for docs generation.
version: 1.0.0
license: MIT
---

# Documenting Expo APIs

Guidelines for writing TSDoc comments in Expo SDK packages. The docs generation system (GenerateDocsAPIData.ts + TypeDoc) extracts these comments to produce API reference documentation.

**Document APIs as you write them, not as an afterthought.** When implementing new features, write TSDoc comments alongside the code.

## When to Use

- **Implementing new features** that expose public TypeScript APIs
- Adding or modifying public APIs in `packages/expo-*`
- Documenting functions, types, interfaces, constants, or enums
- Adding platform-specific annotations
- Writing code examples in docblocks

## Core Principles

1. **Third-person declarative** &mdash; describe what the function does, not what to do
2. **Explain the iceberg** &mdash; document failure modes, side effects, concurrency behavior, not just params/returns
3. **Quality over quantity** &mdash; no docs is better than useless docs like "The width" for a `width` property

## Function Documentation

Use third-person declarative ("Gets...", "Returns...", "Checks..."), not imperative ("Get...", "Return...").

```typescript
/**
 * Gets the uptime since the last reboot of the device, in milliseconds.
 * Android devices do not count time spent in deep sleep.
 *
 * @return A promise fulfilled with the milliseconds since last reboot.
 *
 * @example
 * ```ts
 * const uptime = await Device.getUptimeAsync();
 * // 4371054
 * ```
 *
 * @platform android
 * @platform ios
 */
export async function getUptimeAsync(): Promise<number> {
```

**Key points:**
- First sentence: what the function does
- Additional sentences: important behavior, edge cases, platform differences
- Leave off trailing period for single-phrase descriptions
- Use periods when writing multiple sentences

## Parameter Documentation

```typescript
/**
 * Sets the sensor update interval.
 *
 * @param intervalMs Desired interval in milliseconds between sensor updates.
 * > Starting from Android 12 (API level 31), the system has a 200Hz limit for each sensor updates.
 * >
 * > If you need an update interval less than 5ms, add `android.permission.HIGH_SAMPLING_RATE_SENSORS`
 * > to [**app.json** `permissions` field](/versions/latest/config/app/#permissions).
 */
setUpdateInterval(intervalMs: number): void {
```

**Format:** `@param paramName Description starting with capital letter`

Parameters can include:
- Markdown formatting (links, emphasis, lists)
- Blockquotes for important notes
- Links to documentation pages

## Type and Interface Documentation

Document each property individually:

```typescript
export type GetImageOptions = {
  /**
   * The format of the clipboard image to be converted to.
   */
  format: 'png' | 'jpeg';
  /**
   * Specify the quality of the returned image, between `0` and `1`.
   * Applicable only when `format` is set to `jpeg`, ignored otherwise.
   * @default 1
   */
  jpegQuality?: number;
};
```

**Teach something useful.** Bad: "The width". Good: "The width of the captured photo, measured in pixels".

## Supported TSDoc Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Parameter description | `@param options Configuration for the request` |
| `@return` / `@returns` | Return value description | `@return A promise fulfilled with the result` |
| `@default` | Default value (no markdown, rendered as inline code) | `@default 1` |
| `@platform` | Platform availability (android, ios, web, expo) | `@platform ios 11+` |
| `@example` | Code example (placed at bottom of description) | See examples below |
| `@deprecated` | Deprecation notice (auto-formatted as warning) | `@deprecated Use newMethod() instead` |
| `@experimental` | Experimental API label | `@experimental` |
| `@hidden` / `@internal` / `@private` | Hide from generated docs | `@hidden` |
| `@header` | Group methods under custom headers | `@header Scheduling` |
| `@needsAudit` | Mark for security/API audit (comment, not tag) | `// @needsAudit` |
| `@hideType` | Hide generated Type callout for constants | `@hideType` |

**Platform tag notes:**
- **Do NOT use `@platform` when all platforms are supported** &mdash; only add when limiting availability
- Use multiple `@platform` tags for multiple platforms (one per line)
- Can specify minimum version: `@platform ios 11+`
- Available platforms: `android`, `ios`, `web`, `expo` (Expo Go)

## Code Examples in Docblocks

Always wrap in triple backticks with language tag:

```typescript
/**
 * Checks device root/jailbreak status.
 *
 * @example
 * ```ts
 * const isRooted = await Device.isRootedExperimentalAsync();
 * if (isRooted) {
 *   console.warn('Device may be compromised');
 * }
 * ```
 */
```

## Blockquote Notes and Warnings

Use `>` blockquotes for important callouts:

```typescript
/**
 * > **Note:** This method requires the `CAMERA` permission.
 *
 * > **warning** This method is experimental and not completely reliable.
 */
```

Formats:
- `> **Note:**` &mdash; informational
- `> **warning**` &mdash; caution (lowercase "warning")
- Multi-line notes use `>` on each line with blank `>` between paragraphs

## Constant Documentation

```typescript
/**
 * `true` if the app is running on a real device and `false` if running
 * in a simulator or emulator. On web, this is always set to `true`.
 */
export const isDevice: boolean = ExpoDevice.isDevice;
```

## Enum Documentation

Document the enum and individual values:

```typescript
/**
 * Type used to define what type of data is stored in the clipboard.
 */
export enum ContentType {
  PLAIN_TEXT = 'plain-text',
  HTML = 'html',
  IMAGE = 'image',
  /**
   * @platform iOS
   */
  URL = 'url',
}
```

## Return Value Language

Use **"resolves to"** in `@returns` tags, following MDN's convention:

- **Preferred:** `@returns A promise that resolves to a CameraPhoto object.`
- **Also acceptable:** `@returns A promise fulfilled with a CameraPhoto object.`

In inline prose, "resolves with" is acceptable (e.g. "The promise resolves with the parsed result").

## Type Export Patterns

**Critical:** Types must be exported from the entry point file for docs generation to pick them up.

**Direct re-export from types file:**

```typescript
// index.ts or MainModule.ts
export {
  type FileCreateOptions,
  type DirectoryCreateOptions,
  type FileHandle,
} from './Module.types';
```

**Re-export after import:**

```typescript
// Haptics.ts
import { NotificationFeedbackType, ImpactFeedbackStyle } from './Haptics.types';

// ... function implementations ...

export { NotificationFeedbackType, ImpactFeedbackStyle };
```

The GenerateDocsAPIData script processes the entry point specified in its package mapping and extracts all publicly exported symbols.

---

## Writing Usage Examples (for .mdx docs)

When writing examples in documentation pages:

### Code Block Format

```
```ts app/(tabs)/index.tsx
import * as FileSystem from 'expo-file-system';

const content = await FileSystem.readAsStringAsync(uri);
```
```

Always include:
- Language tag (`ts`, `tsx`, `js`, `json`, `swift`, `kotlin`)
- File path label when showing where code goes

### Interactive Snack Examples

```jsx
<SnackInline label="Basic file read" dependencies={['expo-file-system']}>
```tsx
import * as FileSystem from 'expo-file-system';

export default function App() {
  // ...
}
```
</SnackInline>
```

### Collapsible Examples

```jsx
<Collapsible summary="Advanced usage with error handling">
```ts
try {
  const result = await someAsyncOperation();
} catch (error) {
  console.error('Operation failed:', error);
}
```
</Collapsible>
```

### API Reference Section

End documentation pages with:

```jsx
<APISection packageName="expo-file-system" apiName="FileSystem" />
```

This auto-generates the API reference from TSDoc comments.

---

## Quick Reference

**Do:**
- Use third-person declarative ("Gets", "Returns", "Checks")
- Document behavior beyond params/returns (failures, side effects, concurrency)
- Use `@platform` tags for platform-specific APIs
- Include practical `@example` blocks
- Export types from entry points

**Don't:**
- Write useless descriptions ("The width" for a width property)
- Use imperative mood ("Get the value")
- Skip documentation for complex behavior
- Forget to re-export types for docs generation
- Use `@link` tag (not supported &mdash; use standard markdown links)
- Add `@platform` tags when all platforms are supported
