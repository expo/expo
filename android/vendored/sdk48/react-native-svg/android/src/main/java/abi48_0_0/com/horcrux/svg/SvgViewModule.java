/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

package abi48_0_0.com.horcrux.svg;

import abi48_0_0.com.facebook.react.bridge.Callback;
import abi48_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi48_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi48_0_0.com.facebook.react.bridge.ReactMethod;
import abi48_0_0.com.facebook.react.bridge.ReadableMap;
import abi48_0_0.com.facebook.react.bridge.UiThreadUtil;
import javax.annotation.Nonnull;

class SvgViewModule extends ReactContextBaseJavaModule {
  SvgViewModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Nonnull
  @Override
  public String getName() {
    return "RNSVGSvgViewManager";
  }

  private static void toDataURL(
      final int tag, final ReadableMap options, final Callback successCallback, final int attempt) {
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            SvgView svg = SvgViewManager.getSvgViewByTag(tag);

            if (svg == null) {
              SvgViewManager.runWhenViewIsAvailable(
                  tag,
                  new Runnable() {
                    @Override
                    public void run() {
                      SvgView svg = SvgViewManager.getSvgViewByTag(tag);
                      if (svg == null) { // Should never happen
                        return;
                      }
                      svg.setToDataUrlTask(
                          new Runnable() {
                            @Override
                            public void run() {
                              toDataURL(tag, options, successCallback, attempt + 1);
                            }
                          });
                    }
                  });
            } else if (svg.notRendered()) {
              svg.setToDataUrlTask(
                  new Runnable() {
                    @Override
                    public void run() {
                      toDataURL(tag, options, successCallback, attempt + 1);
                    }
                  });
            } else {
              if (options != null) {
                successCallback.invoke(
                    svg.toDataURL(options.getInt("width"), options.getInt("height")));
              } else {
                successCallback.invoke(svg.toDataURL());
              }
            }
          }
        });
  }

  @SuppressWarnings("unused")
  @ReactMethod
  public void toDataURL(int tag, ReadableMap options, Callback successCallback) {
    toDataURL(tag, options, successCallback, 0);
  }
}
