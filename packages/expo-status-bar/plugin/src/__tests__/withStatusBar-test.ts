import {
  resolveProps,
  setAndroidStatusBarStyles,
  setIOSStatusBarInfoPlist,
} from '../withStatusBar';

describe(setIOSStatusBarInfoPlist, () => {
  it('sets hidden and style', () => {
    expect(setIOSStatusBarInfoPlist({}, { hidden: true, style: 'light' })).toStrictEqual({
      UIStatusBarHidden: true,
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
    });
  });

  it('sets dark style', () => {
    expect(setIOSStatusBarInfoPlist({}, { style: 'dark' })).toStrictEqual({
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    });
  });

  it('sets hidden only', () => {
    expect(setIOSStatusBarInfoPlist({}, { hidden: true })).toStrictEqual({
      UIStatusBarHidden: true,
    });
  });

  it('overrides existing UIStatusBarHidden', () => {
    expect(setIOSStatusBarInfoPlist({ UIStatusBarHidden: false }, { hidden: true })).toStrictEqual({
      UIStatusBarHidden: true,
    });
  });

  it('overrides existing UIStatusBarStyle', () => {
    expect(
      setIOSStatusBarInfoPlist({ UIStatusBarStyle: 'UIStatusBarStyleDefault' }, { style: 'light' })
    ).toStrictEqual({
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
    });
  });

  it('does nothing with empty props', () => {
    expect(setIOSStatusBarInfoPlist({}, {})).toStrictEqual({});
  });

  it('preserves existing infoPlist entries', () => {
    expect(setIOSStatusBarInfoPlist({ CFBundleName: 'MyApp' }, { style: 'dark' })).toStrictEqual({
      CFBundleName: 'MyApp',
      UIStatusBarStyle: 'UIStatusBarStyleDarkContent',
    });
  });
});

describe(resolveProps, () => {
  it('returns undefined for nullish or empty props', () => {
    expect(resolveProps(undefined)).toBeUndefined();
    expect(resolveProps({})).toBeUndefined();
    expect(resolveProps({ style: undefined })).toBeUndefined();
  });

  it('resolves props', () => {
    expect(resolveProps({ style: 'dark' })).toStrictEqual({ style: 'dark' });
    expect(resolveProps({ hidden: true })).toStrictEqual({ hidden: true });
  });
});

describe(setAndroidStatusBarStyles, () => {
  const parent = 'Theme.AppCompat.DayNight.NoActionBar';

  const baseStyles = () => ({
    resources: { style: [{ $: { name: 'AppTheme', parent }, item: [] }] },
  });

  const appTheme = (items: { name: string; value: string }[]) => ({
    $: { name: 'AppTheme', parent },
    item: items.map(({ name, value }) => ({ $: { name }, _: value })),
  });

  it('sets all styles', () => {
    const result = setAndroidStatusBarStyles(baseStyles(), { hidden: true, style: 'dark' });

    expect(result.resources.style).toStrictEqual([
      appTheme([
        { name: 'expoStatusBarHidden', value: 'true' },
        { name: 'android:windowLightStatusBar', value: 'true' },
      ]),
    ]);
  });

  it('sets light style', () => {
    const result = setAndroidStatusBarStyles(baseStyles(), { style: 'light' });

    expect(result.resources.style).toStrictEqual([
      appTheme([{ name: 'android:windowLightStatusBar', value: 'false' }]),
    ]);
  });

  it('sets hidden only', () => {
    const result = setAndroidStatusBarStyles(baseStyles(), { hidden: true });

    expect(result.resources.style).toStrictEqual([
      appTheme([{ name: 'expoStatusBarHidden', value: 'true' }]),
    ]);
  });

  it('does nothing with empty props', () => {
    const result = setAndroidStatusBarStyles(baseStyles(), {});

    expect(result).toStrictEqual(baseStyles());
  });

  it('redefines duplicates', () => {
    const styles = setAndroidStatusBarStyles(baseStyles(), { hidden: true });

    expect(styles.resources.style).toStrictEqual([
      appTheme([{ name: 'expoStatusBarHidden', value: 'true' }]),
    ]);

    const updated = setAndroidStatusBarStyles(styles, { hidden: false });

    expect(updated.resources.style).toStrictEqual([
      appTheme([{ name: 'expoStatusBarHidden', value: 'false' }]),
    ]);
  });

  it('removes style when prop is unset', () => {
    const styles = setAndroidStatusBarStyles(baseStyles(), { hidden: true, style: 'dark' });
    const result = setAndroidStatusBarStyles(styles, {});

    expect(result.resources.style).toStrictEqual([appTheme([])]);
  });
});
