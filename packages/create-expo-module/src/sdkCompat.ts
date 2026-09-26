import fs from 'node:fs';
import path from 'node:path';

/**
 * Overrides for values that differ between the Expo SDK the generated module targets and the SDK
 * the template is written for. Every field is optional: templates hard-code the values for their
 * own SDK and only consult these overrides, so a template also renders correctly when an older CLI
 * passes no `compat` at all.
 */
export type SdkCompat = {
  /** Minimum iOS / tvOS version written to the generated podspec. */
  iosDeploymentTarget?: string;
  /** Jetpack Compose artifact versions written to the generated `build.gradle`. */
  composeVersions?: {
    foundation: string;
    ui: string;
    material3: string;
  };
  /**
   * Whether `@expo/ui` has the current API surface: `ExpoUIView` takes a `Content {}` block, and
   * `@expo/ui/jetpack-compose/modifiers` exports `createModifier`, `ModifierConfig` and
   * `createViewModifierEventListener`. SDK 55 predates all of these.
   */
  modernExpoUI?: boolean;
};

/** File inside the template's `snippets/` directory that holds the per-SDK overrides. */
export const SDK_COMPAT_FILENAME = 'sdk-compat.json';

/**
 * Returns the template package's overrides for the given SDK major version. The table lives with
 * the template (not the CLI), because the two are versioned independently. Returns no overrides
 * when the SDK is unknown, has no entry, or the template predates the table.
 */
export function getSdkCompat(snippetsDir: string, sdkMajor: number | null): SdkCompat {
  if (sdkMajor == null) {
    return {};
  }
  const tablePath = path.join(snippetsDir, SDK_COMPAT_FILENAME);
  if (!fs.existsSync(tablePath)) {
    return {};
  }
  const table = JSON.parse(fs.readFileSync(tablePath, 'utf8')) as Record<string, SdkCompat>;
  return table[String(sdkMajor)] ?? {};
}
