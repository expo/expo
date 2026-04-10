import * as WarningAggregator from '../../utils/warnings';
import { getAppThemeGroup, getStylesGroupAsObject } from '../Styles';
import { setSystemBarsStyles, withSystemBars } from '../SystemBars';

jest.mock('../../utils/warnings');

describe('e2e: Android system bars', () => {
  it('does not warn when neither androidStatusBar nor androidNavigationBar is set', () => {
    withSystemBars({ name: 'test', slug: 'test' });

    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalled();
  });

  it('warns when androidStatusBar is set', () => {
    withSystemBars({ name: 'test', slug: 'test', androidStatusBar: {} });

    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'SYSTEM_BARS_PLUGIN',
      '`androidStatusBar` is deprecated and has no effect. Use the `expo-status-bar` plugin configuration instead.'
    );
  });

  it('warns when androidNavigationBar is set', () => {
    withSystemBars({ name: 'test', slug: 'test', androidNavigationBar: {} });

    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledWith(
      'SYSTEM_BARS_PLUGIN',
      '`androidNavigationBar` is deprecated and has no effect. Use the `expo-navigation-bar` plugin configuration instead.'
    );
  });

  it(`sets the system bars color to '@android:color/transparent'`, async () => {
    const styles = setSystemBarsStyles({ resources: {} });
    const group = getStylesGroupAsObject(styles, getAppThemeGroup());
    expect(group?.['android:statusBarColor']).toBe('@android:color/transparent');
    expect(group?.['android:navigationBarColor']).toBe('@android:color/transparent');
  });
});
