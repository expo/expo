// The declaration `tsc` needs and Metro does not.
//
// Metro resolves `../lib/platform-note` to `platform-note.android.ts` or `platform-note.ios.ts` by
// platform extension; TypeScript does not follow those extensions unless the project sets
// `moduleSuffixes`, so without this file `@expo/agent-cli typecheck` reports TS2307 for a module that
// bundles fine [observed — the first run of this suite, 2026-08-27]. That is a real difference
// between the two tools and not a defect in either, and a fixture that carried it would make every
// `typecheck` row in this suite red for a reason that is not about the CLI.
export const PLATFORM_NOTE: string;
