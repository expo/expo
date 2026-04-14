import { buildContentsJsonImages } from '../withIosSplashAssets';

describe(buildContentsJsonImages, () => {
  it(`supports dark mode`, () => {
    expect(
      buildContentsJsonImages({
        image: 'somn',
        darkImage: 'other',
        tabletImage: undefined,
        darkTabletImage: undefined,
      }).length
    ).toBe(6);

    expect(
      buildContentsJsonImages({
        image: 'somn',
        darkImage: undefined,
        tabletImage: undefined,
        darkTabletImage: undefined,
      }).length
    ).toBe(3);
  });
});
