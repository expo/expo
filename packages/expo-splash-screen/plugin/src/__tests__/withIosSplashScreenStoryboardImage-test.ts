import { toString } from '../InterfaceBuilder';
import { getIosSplashConfig } from '../getIosSplashConfig';
import { getTemplateAsync } from '../withIosSplashScreenStoryboard';
import { applySplashScreenStoryboard } from '../withIosSplashScreenStoryboardImage';

describe(applySplashScreenStoryboard, () => {
  it(`gets a splash screen without options`, async () => {
    const xml = await getTemplateAsync();

    const contents = await applySplashScreenStoryboard(
      xml,
      getIosSplashConfig({
        image: 'splash.png',
        backgroundColor: '#ff00ff',
        resizeMode: 'cover',
      })
    );

    expect(toString(contents)).not.toMatch(/contentMode="scaleAspectFit"/);
  });
});
