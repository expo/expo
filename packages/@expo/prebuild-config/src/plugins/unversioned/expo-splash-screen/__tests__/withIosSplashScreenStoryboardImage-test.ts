import { toString } from '../InterfaceBuilder';
import { getTemplateAsync } from '../withIosSplashScreenStoryboard';
import { applySplashScreenStoryboard } from '../wtihIosSplashScreenStoryboardImage';

describe(applySplashScreenStoryboard, () => {
  it(`gets a splash screen without options`, async () => {
    const xml = await getTemplateAsync();

    const contents = await applySplashScreenStoryboard(xml, {
      image: 'splash.png',
      backgroundColor: '#ff00ff',
      resizeMode: 'cover',
      tabletImage: null,
      tabletBackgroundColor: null,
    });
    expect(toString(contents)).not.toMatch(/contentMode="scaleAspectFit"/);
  });
});
