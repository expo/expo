import * as VendoredTabs from '../../react-navigation/bottom-tabs';
import * as TabsEntry from '../Tabs';

describe('expo-router/js-tabs re-exports', () => {
  it('re-exports every value from ../react-navigation/bottom-tabs', () => {
    const missing = Object.keys(VendoredTabs).filter((key) => !(key in TabsEntry));
    expect(missing).toEqual([]);
  });

  it('exports the Tabs navigator with its static components', () => {
    expect(TabsEntry.Tabs).toBeDefined();
    expect(TabsEntry.default).toBe(TabsEntry.Tabs);
    expect(TabsEntry.Tabs.Screen).toBeDefined();
    expect(TabsEntry.Tabs.Protected).toBeDefined();
  });

  it('resolves transition easing lazily', () => {
    expect(TabsEntry.TransitionSpecs.FadeSpec.config).toMatchObject({
      duration: 150,
      easing: expect.any(Function),
    });
    expect(TabsEntry.TransitionSpecs.ShiftSpec.config).toMatchObject({
      duration: 150,
      easing: expect.any(Function),
    });
  });
});
