import * as vendored from '../../react-navigation/material-top-tabs';
import * as entry from '../TopTabs';

describe('expo-router/js-top-tabs re-exports', () => {
  it('re-exports every value from ../react-navigation/material-top-tabs', () => {
    const missing = Object.keys(vendored).filter((key) => !(key in entry));
    expect(missing).toEqual([]);
  });

  it('exports the TopTabs navigator with its static components', () => {
    expect(entry.TopTabs).toBeDefined();
    expect(entry.default).toBe(entry.TopTabs);
    expect(entry.TopTabs.Screen).toBeDefined();
    expect(entry.TopTabs.Protected).toBeDefined();
  });
});
