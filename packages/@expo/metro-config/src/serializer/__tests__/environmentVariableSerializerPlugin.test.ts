import {
  environmentVariableSerializerPlugin,
  getTransformEnvironment,
  getEnvVarDevString,
  serverPreludeSerializerPlugin,
} from '../environmentVariableSerializerPlugin';
import { installPackedMap } from '../packedMap';

describe(serverPreludeSerializerPlugin, () => {
  it('updates lineCount after modifying the server prelude', () => {
    const data = {
      code: 'process=this.process||{},first\nsecond',
      lineCount: 99,
    };
    const prelude = {
      path: '__prelude__',
      output: [{ type: 'js/script', data }],
    };

    serverPreludeSerializerPlugin(
      '/index.js',
      [prelude] as any,
      { transformOptions: { customTransformOptions: { environment: 'node' } } } as any,
      {} as any
    );

    expect(data).toEqual({
      code: 'first\nsecond',
      lineCount: 2,
    });
  });
});

describe(environmentVariableSerializerPlugin, () => {
  it('sets lineCount when inserting the environment prelude', () => {
    const preModules: any[] = [];

    environmentVariableSerializerPlugin(
      '/index.js',
      preModules,
      { transformOptions: { customTransformOptions: { environment: 'client' } } } as any,
      { dev: true } as any
    );

    const data = preModules[0].output[0].data;
    expect(data.lineCount).toBe(data.code.split(/\r\n?|\n|\u2028|\u2029/).length);
  });

  it('updates lineCount after replacing the environment prelude', () => {
    const data = {
      code: 'first\nsecond\nthird',
      lineCount: 3,
    };
    const prelude = {
      path: '\0polyfill:environment-variables',
      output: [{ type: 'js/script', data }],
    };

    environmentVariableSerializerPlugin(
      '/index.js',
      [prelude] as any,
      { transformOptions: { customTransformOptions: { environment: 'client' } } } as any,
      { dev: true } as any
    );

    expect(data.code).toBe(getEnvVarDevString());
    expect(data.lineCount).toBe(1);
  });

  it('discards the transformed map when replacing the environment prelude', () => {
    const data = {
      code: '(function (global) {\n//\n})(globalThis);',
      lineCount: 3,
      map: undefined,
    };
    installPackedMap(data, [
      [2, 0, 1, 0],
      [3, 0],
    ]);
    const previousPackedMap = (data as any).__packedMap;
    const prelude = {
      path: '\0polyfill:environment-variables',
      output: [{ type: 'js/script', data }],
    };

    environmentVariableSerializerPlugin(
      '/index.js',
      [prelude] as any,
      { transformOptions: { customTransformOptions: { environment: 'client' } } } as any,
      { dev: true } as any
    );

    expect(data.code).toBe(getEnvVarDevString());
    expect(data.lineCount).toBe(1);
    expect((data as any).__packedMap).not.toBe(previousPackedMap);
    expect((data as any).__packedMap.count).toBe(0);
    expect(data.map).toEqual([]);
  });
});

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
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {"EXPO_PUBLIC_TEST": { enumerable: true, value: "test\\nvalue" }});"`
    );
  });
  it(`formats multiple env vars`, () => {
    expect(
      getEnvVarDevString({
        EXPO_PUBLIC_A: 'a',
        EXPO_PUBLIC_B: 'b',
      })
    ).toMatchInlineSnapshot(
      `"/* HMR env vars from Expo CLI (dev-only) */ process.env=Object.defineProperties(process.env, {"EXPO_PUBLIC_A": { enumerable: true, value: "a" },"EXPO_PUBLIC_B": { enumerable: true, value: "b" }});"`
    );
  });
});
