import { DevToolsPluginCliExtensionResults } from '../DevToolsPluginCliExtensionResults';

describe('DevToolsPluginCliExtensionResults', () => {
  describe('exit code handling', () => {
    it('should return the exit code that was set', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      valueToTest.exit(5);
      expect(valueToTest.getOutput()).toEqual([
        { type: 'text', text: 'Process exited with code 5', level: 'error' },
      ]);
    });
  });

  describe('output string parsing', () => {
    it('should return a text output with stdout for stdout as string and success state', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      valueToTest.append('Just some text output');
      expect(valueToTest.getOutput()).toEqual([
        { type: 'text', text: 'Just some text output', level: 'info' },
      ]);
    });
  });

  describe('output json string parsing', () => {
    it('should return an error line if the json is not valid according to the schema', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      valueToTest.append(JSON.stringify([{ anotherValue: 234, text: 'Unexpected number' }]));
      expect(valueToTest.getOutput()).toEqual([
        { type: 'text', text: 'Invalid JSON: Invalid input', level: 'error' },
      ]);
    });

    it('should accept json output as std-out and parse it as such', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      const elements = [
        { type: 'text', text: 'Just some text output', level: 'info' },
        { type: 'image', url: 'https://example.com/image.png' },
      ];
      valueToTest.append(JSON.stringify(elements));
      expect(valueToTest.getOutput()).toEqual(elements);
    });

    it('should accept json output as std-err and parse it as such', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      const elements = [
        { type: 'text', text: 'This is an info text', level: 'info' },
        { type: 'image', url: 'https://example.com/image.png' },
      ];
      valueToTest.append(JSON.stringify(elements), 'error');
      expect(valueToTest.getOutput()).toEqual(elements);
    });
  });

  describe('output truncation', () => {
    it('truncates output once accumulated length exceeds MAX_STRING_LENGTH and stops accepting more', () => {
      jest.isolateModules(() => {
        jest.doMock('node:buffer', () => ({
          constants: { MAX_STRING_LENGTH: 100 },
        }));
        const {
          DevToolsPluginCliExtensionResults: Results,
        } = require('../DevToolsPluginCliExtensionResults');

        const onOutput = jest.fn();
        const results = new Results(onOutput);
        results.append('a'.repeat(80));
        expect(results.isTruncated()).toBe(false);

        // Pushes total to 110 > 100 cap → truncation triggers.
        results.append('b'.repeat(30));
        expect(results.isTruncated()).toBe(true);

        const output = results.getOutput();
        expect(output[output.length - 1].text).toMatch(/Output truncated/);
        expect(onOutput).toHaveBeenLastCalledWith([
          expect.objectContaining({ text: expect.stringMatching(/Output truncated/) }),
        ]);

        // Subsequent appends are no-ops; output length and isTruncated stay put.
        const lengthBefore = results.getOutput().length;
        const onOutputCalls = onOutput.mock.calls.length;
        results.append('c'.repeat(10));
        expect(results.getOutput()).toHaveLength(lengthBefore);
        expect(onOutput.mock.calls).toHaveLength(onOutputCalls);
      });
    });
  });
});
