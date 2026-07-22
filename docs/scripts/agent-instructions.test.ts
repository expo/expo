import { buildFeedbackSection } from './agent-instructions.ts';

describe('buildFeedbackSection', () => {
  it('prints the Expo feedback CLI command and curl fallback with the page URL', () => {
    expect(buildFeedbackSection('/skills/')).toBe(`## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

Preferred command:
npx --yes submit-expo-feedback@latest --category docs --subject "/skills/" "<actionable feedback>"

Direct HTTP fallback:
curl -X POST https://api.expo.dev/v2/feedback/docs-send -H 'Content-Type: application/json' -d '{"url":"/skills/","feedback":"<actionable feedback>"}'

Only submit when you have something specific and actionable to report. Try to give the most context.`);
  });
});
