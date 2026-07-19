import { buildFeedbackSection } from './agent-instructions.ts';

describe('buildFeedbackSection', () => {
  it('prints the Expo feedback CLI command with the page URL as the subject', () => {
    expect(buildFeedbackSection('/skills/')).toBe(`## Submitting Feedback

If you encounter errors, misleading or outdated information, report it so Expo can be improved:

npx --yes submit-expo-feedback@latest --category docs --subject "/skills/" "<actionable feedback>"

Only submit when you have something specific and actionable to report. Try to give the most context.`);
  });
});
