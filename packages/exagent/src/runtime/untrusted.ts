// @ref llp/0008-guardrails.rfc.md
// Marking for app-originated content in command output.
//
// Values, logs, and error text that come from the running app can contain text written by a user
// or an attacker. A driving agent must treat that text as data, never as instructions. Commands
// that relay app-originated content fence it with these markers so the agent can tell the two
// apart.

export const UNTRUSTED_OUTPUT_BEGIN = '--- BEGIN UNTRUSTED APP OUTPUT ---';
export const UNTRUSTED_OUTPUT_END = '--- END UNTRUSTED APP OUTPUT ---';

/**
 * Fences app-originated text in untrusted markers.
 *
 * Markers found inside the text itself are neutralized, so app content cannot forge the end of
 * the block and pass the rest of itself off as trusted command output.
 */
export function wrapUntrustedAppOutput(text: string): string {
  return [UNTRUSTED_OUTPUT_BEGIN, neutralizeMarkers(text), UNTRUSTED_OUTPUT_END].join('\n');
}

/**
 * The same neutralization, for output that is *streamed* rather than collected.
 *
 * A tool whose bytes reach the terminal as they arrive cannot be wrapped after the fact, so the
 * caller prints the markers around the run and hands this in as the per-line filter — otherwise the
 * content could forge the end marker and pass the rest of itself off as trusted command output.
 */
export function neutralizeUntrustedMarkers(line: string): string {
  return neutralizeMarkers(line);
}

function neutralizeMarkers(text: string): string {
  return text
    .replaceAll(UNTRUSTED_OUTPUT_BEGIN, '--- (escaped) BEGIN UNTRUSTED APP OUTPUT ---')
    .replaceAll(UNTRUSTED_OUTPUT_END, '--- (escaped) END UNTRUSTED APP OUTPUT ---');
}
