import {
  getTransformEnvironment,
  getEnvVarDevString,
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

describe(getEnvVarDevString, () => {
  it(`always formats env var code in one line`, () => {
    expect(getEnvVarDevString({})).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {});"`
    );
  });
  it(`formats env vars with new line characters in them`, () => {
    expect(
      getEnvVarDevString({
        EXPO_PUBLIC_TEST: 'test\nvalue',
      })
    ).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {"EXPO_PUBLIC_TEST": { value: "test\\nvalue" }});"`
    );
  });
  it(`formats multiple env vars`, () => {
    expect(
      getEnvVarDevString({
        EXPO_PUBLIC_A: 'a',
        EXPO_PUBLIC_B: 'b',
      })
    ).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {"EXPO_PUBLIC_A": { value: "a" },"EXPO_PUBLIC_B": { value: "b" }});"`
    );
  });
});
