/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi31_0_0.host.exp.exponent.modules.api.components.svg;

import abi31_0_0.com.facebook.react.bridge.Callback;
import abi31_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi31_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi31_0_0.com.facebook.react.bridge.ReactMethod;

class SvgViewModule extends ReactContextBaseJavaModule {
    SvgViewModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "RNSVGSvgViewManager";
    }


    @ReactMethod
    public void toDataURL(int tag, Callback successCallback) {
        SvgView svg = SvgViewManager.getSvgViewByTag(tag);

        if (svg != null) {
            successCallback.invoke(svg.toDataURL());
        }
    }
}
