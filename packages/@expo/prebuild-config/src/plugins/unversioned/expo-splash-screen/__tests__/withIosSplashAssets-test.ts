import { buildContentsJsonImages } from '../withIosSplashAssets';

describe(buildContentsJsonImages, () => {
  it(`supports dark mode`, () => {
    expect(buildContentsJsonImages({ image: 'somn', darkImage: 'other' } as any).length).toBe(6);
    expect(buildContentsJsonImages({ image: 'somn', darkImage: null } as any).length).toBe(3);
  });
});
