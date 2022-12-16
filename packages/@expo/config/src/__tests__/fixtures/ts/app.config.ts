import { ConfigContext, ExpoConfig } from '@expo/config';

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
  config.name = 'rewrote+' + config.name;
  // Supports optionals and nullish
  config.foo = 'bar+' + (foo.bar?.foo ?? 'invalid');
  return config;
}
