import { buildFeedbackSection } from './agent-instructions.ts';

describe('buildFeedbackSection', () => {
  it('requires consent before showing the feedback commands', () => {
    expect(buildFeedbackSection('/skills/')).toBe(`## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

Ask the user for explicit approval before running either command below. Show the
command and explain that it sends the page path, feedback text, model, and
harness to Expo's feedback service. Do not run these commands automatically.

Preferred command (after approval):
npx submit-expo-feedback@latest --category docs --subject "/skills/" "<actionable feedback>"

Direct HTTP fallback (after approval):
curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/skills/","feedback":"🤖 Agent feedback for docs: <specific, actionable description> (<model>, <harness>)"}'

Only submit when you have something specific and actionable to report. Try to
give the most context. Users can opt out of Expo telemetry with
\`DO_NOT_TRACK=1\` or \`EXPO_NO_TELEMETRY=1\`.`);
  });
});