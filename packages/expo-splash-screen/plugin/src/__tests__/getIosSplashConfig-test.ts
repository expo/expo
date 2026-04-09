import { getIosSplashConfig } from '../getIosSplashConfig';

describe(getIosSplashConfig, () => {
  it(`uses the provided splash config directly`, () => {
    const config = getIosSplashConfig({
      image: 'b',
    });
    expect(config.image).toBe('b');
    // resizeMode defaults to contain when not provided
    expect(config.resizeMode).toBe('contain');
    // backgroundColor defaults to #ffffff when not provided
    expect(config.backgroundColor).toBe('#ffffff');
  });
});
