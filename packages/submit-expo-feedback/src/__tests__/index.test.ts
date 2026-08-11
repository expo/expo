describe('library entry point', () => {
  it('exposes the submit interface without running the CLI', () => {
    const index = require('../index');

    expect(typeof index.sendFeedbackAsync).toBe('function');
    expect(typeof index.runExpoFeedbackAsync).toBe('function');
    expect(typeof index.logErrorAndExit).toBe('function');
    expect(index.CLI_FEEDBACK_CATEGORIES).toContain('simulator');
    expect(index.CLI_FEEDBACK_MAX_LENGTH).toBe(5_000);
  });
});
