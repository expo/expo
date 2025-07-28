import { getExpoCliPluginParameters } from '../CliExtension';

describe('getExpoCliPluginParameters', () => {
  it('should throw exception if no command is provided', () => {
    expect(() => getExpoCliPluginParameters(['node', 'script.js'])).toThrow('No command provided.');
  });
  it('should throw exception if args JSON is invalid', () => {
    expect(() =>
      getExpoCliPluginParameters(['node', 'script.js', 'cmd', '{invalidJson'])
    ).toThrow();
  });
  it('should throw exception if apps JSON is invalid', () => {
    expect(() =>
      getExpoCliPluginParameters(['node', 'script.js', 'cmd', '{}', '{invalidJson'])
    ).toThrow();
  });
  it('should throw exception if args is not an object', () => {
    expect(() =>
      getExpoCliPluginParameters(['node', 'script.js', 'cmd', '["not", "an", "object"]', '[]'])
    ).toThrow();
  });
  it('should throw exception if apps is not an array', () => {
    expect(() =>
      getExpoCliPluginParameters(['node', 'script.js', 'cmd', '{}', '{"not": "an array"}'])
    ).toThrow('Apps parameter must be an array.');
  });
});
