import { transformButtonProps } from '../index';

describe('transformButtonProps', () => {
  it('passes openApp through to the native props', () => {
    expect(transformButtonProps({ openApp: true })).toEqual(
      expect.objectContaining({ openApp: true })
    );
  });

  it('keeps the serialized props unchanged without openApp', () => {
    expect(transformButtonProps({})).toEqual({
      modifiers: undefined,
      enabled: true,
      shape: undefined,
      onButtonPressed: undefined,
    });
  });
});
