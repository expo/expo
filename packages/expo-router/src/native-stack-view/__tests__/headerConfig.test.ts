import { convertOptionsToHeaderConfig } from '../headerConfig';
import type { NativeStackOptions } from '../types';

describe('convertOptionsToHeaderConfig', () => {
  it('uses route name as fallback title', () => {
    const result = convertOptionsToHeaderConfig({}, 'index', false);
    expect(result.title).toBe('index');
  });

  it('uses title option when provided', () => {
    const result = convertOptionsToHeaderConfig({ title: 'Home' }, 'index', false);
    expect(result.title).toBe('Home');
  });

  it('sets hidden when headerShown is false', () => {
    const result = convertOptionsToHeaderConfig({ headerShown: false }, 'index', false);
    expect(result.hidden).toBe(true);
  });

  it('hides back button when canGoBack is false', () => {
    const result = convertOptionsToHeaderConfig({}, 'index', false);
    expect(result.hideBackButton).toBe(true);
  });

  it('shows back button when canGoBack is true', () => {
    const result = convertOptionsToHeaderConfig({}, 'details', true);
    expect(result.hideBackButton).toBe(false);
  });

  it('passes through headerBackTitle', () => {
    const result = convertOptionsToHeaderConfig({ headerBackTitle: 'Back' }, 'details', true);
    expect(result.backTitle).toBe('Back');
  });

  it('passes through headerBackButtonDisplayMode', () => {
    const result = convertOptionsToHeaderConfig(
      { headerBackButtonDisplayMode: 'minimal' },
      'details',
      true
    );
    expect(result.backButtonDisplayMode).toBe('minimal');
  });

  it('maps color options', () => {
    const result = convertOptionsToHeaderConfig(
      {
        headerTintColor: 'red',
        headerBackgroundColor: 'white',
      },
      'index',
      false
    );
    expect(result.color).toBe('red');
    expect(result.backgroundColor).toBe('white');
  });

  it('maps blur effect', () => {
    const result = convertOptionsToHeaderConfig({ headerBlurEffect: 'regular' }, 'index', false);
    expect(result.blurEffect).toBe('regular');
  });

  it('maps large title options', () => {
    const result = convertOptionsToHeaderConfig(
      {
        headerLargeTitle: true,
        headerLargeTitleBackgroundColor: 'blue',
      },
      'index',
      false
    );
    expect(result.largeTitle).toBe(true);
    expect(result.largeTitleBackgroundColor).toBe('blue');
  });

  it('maps shadow visibility', () => {
    const result = convertOptionsToHeaderConfig({ headerShadowVisible: false }, 'index', false);
    expect(result.hideShadow).toBe(true);
  });

  it('does not set hideShadow when headerShadowVisible is true', () => {
    const result = convertOptionsToHeaderConfig({ headerShadowVisible: true }, 'index', false);
    expect(result.hideShadow).toBe(false);
  });

  describe('translucent', () => {
    it('is true when headerTransparent is true', () => {
      const result = convertOptionsToHeaderConfig({ headerTransparent: true }, 'index', false);
      expect(result.translucent).toBe(true);
    });

    it('is true when headerBlurEffect is set', () => {
      const result = convertOptionsToHeaderConfig({ headerBlurEffect: 'light' }, 'index', false);
      expect(result.translucent).toBe(true);
    });

    it('is true when headerLargeTitle is true', () => {
      const result = convertOptionsToHeaderConfig({ headerLargeTitle: true }, 'index', false);
      expect(result.translucent).toBe(true);
    });

    it('is false when none of the translucent triggers are set', () => {
      const result = convertOptionsToHeaderConfig({}, 'index', false);
      expect(result.translucent).toBe(false);
    });
  });

  describe('title style', () => {
    it('maps fontFamily, fontSize, fontWeight, color', () => {
      const options: NativeStackOptions = {
        headerTitleStyle: {
          fontFamily: 'Helvetica',
          fontSize: 20,
          fontWeight: 'bold',
          color: 'navy',
        },
      };
      const result = convertOptionsToHeaderConfig(options, 'index', false);
      expect(result.titleFontFamily).toBe('Helvetica');
      expect(result.titleFontSize).toBe(20);
      expect(result.titleFontWeight).toBe('bold');
      expect(result.titleColor).toBe('navy');
    });
  });

  describe('large title style', () => {
    it('maps fontFamily, fontSize, fontWeight, color', () => {
      const options: NativeStackOptions = {
        headerLargeTitleStyle: {
          fontFamily: 'Georgia',
          fontSize: 34,
          fontWeight: '800',
          color: 'purple',
        },
      };
      const result = convertOptionsToHeaderConfig(options, 'index', false);
      expect(result.largeTitleFontFamily).toBe('Georgia');
      expect(result.largeTitleFontSize).toBe(34);
      expect(result.largeTitleFontWeight).toBe('800');
      expect(result.largeTitleColor).toBe('purple');
    });
  });
});
