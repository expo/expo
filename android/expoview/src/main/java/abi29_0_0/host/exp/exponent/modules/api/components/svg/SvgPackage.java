/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import abi29_0_0.com.facebook.react.ReactPackage;
import abi29_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi29_0_0.com.facebook.react.bridge.NativeModule;
import abi29_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi29_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;


public class SvgPackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
                RenderableViewManager.createGroupViewManager(),
                RenderableViewManager.createPathViewManager(),
                RenderableViewManager.createCircleViewManager(),
                RenderableViewManager.createEllipseViewManager(),
                RenderableViewManager.createLineViewManager(),
                RenderableViewManager.createRectViewManager(),
                RenderableViewManager.createTextViewManager(),
                RenderableViewManager.createTSpanViewManager(),
                RenderableViewManager.createTextPathViewManager(),
                RenderableViewManager.createImageViewManager(),
                RenderableViewManager.createClipPathViewManager(),
                RenderableViewManager.createDefsViewManager(),
                RenderableViewManager.createUseViewManager(),
                RenderableViewManager.createSymbolManager(),
                RenderableViewManager.createLinearGradientManager(),
                RenderableViewManager.createRadialGradientManager(),
                new SvgViewManager());
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.<NativeModule>singletonList(new SvgViewModule(reactContext));
    }

    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }
}
