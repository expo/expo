import type { ConfigContext, ExpoConfig } from '@expo/config';

// Added to test supported language features.
export class Foo {
  static bar = 'bar';
  foobar = true;
  get somn() {
    return '';
  }
}

const foo = { bar: { foo: 'value' } };

export default function ({ config }: ConfigContext): ExpoConfig {
  const mutableConfig = config as ExpoConfig & { foo?: string };
  mutableConfig.name = 'rewrote+' + config.name;
  // Supports optionals and nullish
  mutableConfig.foo = 'bar+' + (foo.bar?.foo ?? 'invalid');
  return mutableConfig;
}
