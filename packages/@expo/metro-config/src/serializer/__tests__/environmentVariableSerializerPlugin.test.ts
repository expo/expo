import {
  replaceEnvironmentVariables,
  getTransformEnvironment,
} from '../environmentVariableSerializerPlugin';

describe(getTransformEnvironment, () => {
  [
    '/index.bundle?platform=web&dev=true&transform.environment=node&hot=false',
    '/index.bundle?transform.environment=node&platform=web&dev=true&hot=false',
    '/index.bundle?platform=web&dev=true&hot=false&transform.environment=node',
    '/index.bundle?transform.environment=node',
  ].forEach((url) => {
    it(`extracts environment from ${url}`, () => {
      expect(getTransformEnvironment(url)).toBe('node');
    });
  });
  it(`works with missing transform`, () => {
    expect(
      getTransformEnvironment(
        '/index.bundle?transform.environment=&platform=web&dev=true&hot=false'
      )
    ).toBe(null);
    expect(getTransformEnvironment('/index.bundle?&platform=web&dev=true&hot=false')).toBe(null);
  });
});

describe(replaceEnvironmentVariables, () => {
  it('matches environment variables', () => {
    const contents = replaceEnvironmentVariables(
      `
                const foo = process.env.JEST_WORKER_ID;
                process.env.ABC;
                console.log(process.env.NODE_ENV);
                console.log(process.env.EXPO_PUBLIC_NODE_ENV);
                process.env.EXPO_PUBLIC_FOO;
    
                a + b = c;
    
                env.EXPO_PUBLIC_URL;
    
                process.env['other'];
                `,
      { EXPO_PUBLIC_NODE_ENV: 'development', EXPO_PUBLIC_FOO: 'bar' }
    );
    expect(contents).toMatch('development');
    expect(contents).toMatch('bar');
    expect(contents).toMatch('process.env.NODE_ENV');
    expect(contents).toMatch('process.env.JEST_WORKER_ID');
    expect(contents).not.toMatch('EXPO_PUBLIC_NODE_ENV');
    expect(contents).not.toMatch('EXPO_PUBLIC_FOO');
    expect(contents).toMatchSnapshot();
  });
});
