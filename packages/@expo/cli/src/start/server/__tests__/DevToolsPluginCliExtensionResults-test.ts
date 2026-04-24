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
        {
          type: 'text',
          text: 'Invalid JSON: "[0].type" must be "text" (got "undefined"); "[0].level" is required',
          level: 'error',
        },
      ]);
    });

    it('should accept json output as std-out and parse it as such', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      const elements = [
        { type: 'text', text: 'Just some text output', level: 'info' },
        { type: 'uri', uri: 'https://example.com/image.png' },
      ];
      valueToTest.append(JSON.stringify(elements));
      expect(valueToTest.getOutput()).toEqual(elements);
    });

    it('should accept json output as std-err and parse it as such', () => {
      const valueToTest = new DevToolsPluginCliExtensionResults();
      const elements = [
        { type: 'text', text: 'This is an info text', level: 'info' },
        { type: 'uri', uri: 'https://example.com/image.png' },
      ];
      valueToTest.append(JSON.stringify(elements), 'error');
      expect(valueToTest.getOutput()).toEqual(elements);
    });
  });
});
