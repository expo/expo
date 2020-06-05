import { mount } from 'enzyme';
import Constants from 'expo-constants';
import * as React from 'react';

import { StatusBar as ExpoStatusBar } from '../StatusBar';

describe('StatusBar', () => {
  describe('no manifest', () => {
    it('defaults to translucent', () => {
      mockNoManifest(() => {
        expect(renderedTranslucentProp(<ExpoStatusBar />)).toBe(true);
      });
    });

    it('respects the translucent value passed in', () => {
      mockNoManifest(() => {
        expect(renderedTranslucentProp(<ExpoStatusBar translucent={false} />)).toBe(false);
      });
    });
  });

  describe('opaque config in manifest', () => {
    it('defaults to opaque', () => {
      mockTranslucency(false, () => {
        expect(renderedTranslucentProp(<ExpoStatusBar />)).toBe(false);
      });
    });

    it('respects the translucent value passed in', () => {
      mockTranslucency(false, () => {
        expect(renderedTranslucentProp(<ExpoStatusBar translucent />)).toBe(true);
      });
    });
  });

  describe('translucent config in manifest', () => {
    it('defaults to translucent', () => {
      mockTranslucency(true, () => {
        expect(renderedTranslucentProp(<ExpoStatusBar />)).toBe(true);
      });
    });

    it('respects the translucent value passed in', () => {
      mockTranslucency(true, () => {
        expect(renderedTranslucentProp(<ExpoStatusBar translucent={false} />)).toBe(false);
      });
    });
  });
});

/** Helpers */

function mockTranslucency(translucent: boolean, fn: any) {
  const originalAndroidStatusBar = Constants.manifest.androidStatusBar;
  const androidStatusBar = { translucent };

  try {
    Constants.manifest.androidStatusBar = androidStatusBar;
    fn();
  } finally {
    Constants.manifest.androidStatusBar = originalAndroidStatusBar;
  }
}

function mockNoManifest(fn: any) {
  const originalManifest = Constants.manifest;
  try {
    // @ts-ignore: types disagree about this being possible, but it is in bare apps
    Constants.manifest = null;
    fn();
  } finally {
    Constants.manifest = originalManifest;
  }
}

function renderedTranslucentProp(element: any) {
  const result = mount(element);

  return result
    .children()
    .first()
    .props().translucent;
}
