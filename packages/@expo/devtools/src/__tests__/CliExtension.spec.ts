import { testing_getExpoCliPluginParameters } from '../runCliExtension';

describe('getExpoCliPluginParameters', () => {
  it('should throw exception if no command is provided', () => {
    expect(() => testing_getExpoCliPluginParameters(['node', 'script.js'])).toThrow(
      'No command provided.'
    );
  });
  it('should throw exception if JSON is invalid', () => {
    expect(() =>
      testing_getExpoCliPluginParameters([
        'node',
        'script.js',
        'cmd',
        'https://localhost:8081',
        '{invalidJson',
      ])
    ).toThrow();
  });
  it('should throw exception if metroServerOrigin is not a string', () => {
    expect(() =>
      // @ts-ignore
      getExpoCliPluginParameters(['node', 'script.js', 'cmd', 100, '["not", "an", "object"]'])
    ).toThrow();
  });
  it('should throw exception if metroServerOrigin is an empty string', () => {
    expect(() =>
      testing_getExpoCliPluginParameters([
        'node',
        'script.js',
        'cmd',
        '',
        '["not", "an", "object"]',
      ])
    ).toThrow();
  });
  it('should read all arguments', () => {
    const { metroServerOrigin, args, command } = testing_getExpoCliPluginParameters([
      'node',
      'script.js',
      'cmd',
      '{"arg1": "some value", "arg2": 123}',
      'https://localhost:8081',
    ]);
    expect(metroServerOrigin).toBe('https://localhost:8081');
    expect(args).toEqual({ arg1: 'some value', arg2: 123 });
    expect(command).toBe('cmd');
  });
});
