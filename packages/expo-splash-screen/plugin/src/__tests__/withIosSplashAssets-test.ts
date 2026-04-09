import { buildContentsJsonImages } from '../withIosSplashAssets';

describe(buildContentsJsonImages, () => {
  it(`supports dark mode`, () => {
    expect(
      buildContentsJsonImages({
        image: 'somn',
        darkImage: 'other',
        tabletImage: null,
        darkTabletImage: null,
      }).length
    ).toBe(6);

    expect(
      buildContentsJsonImages({
        image: 'somn',
        darkImage: null,
        tabletImage: null,
        darkTabletImage: null,
      }).length
    ).toBe(3);
  });
});
