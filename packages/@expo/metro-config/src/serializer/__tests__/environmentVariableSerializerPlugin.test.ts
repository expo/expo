import { getTransformEnvironment } from '../environmentVariableSerializerPlugin';

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
