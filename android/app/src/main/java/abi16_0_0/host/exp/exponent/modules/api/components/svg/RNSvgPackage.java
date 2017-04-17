/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi16_0_0.host.exp.exponent.modules.api.components.svg;

import abi16_0_0.com.facebook.react.ReactPackage;
import abi16_0_0.com.facebook.react.bridge.JavaScriptModule;
import abi16_0_0.com.facebook.react.bridge.NativeModule;
import abi16_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi16_0_0.com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;


public class RNSvgPackage implements ReactPackage {

    @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return Arrays.<ViewManager>asList(
            RNSVGRenderableViewManager.createRNSVGGroupViewManager(),
            RNSVGRenderableViewManager.createRNSVGPathViewManager(),
            RNSVGRenderableViewManager.createRNSVGCircleViewManager(),
            RNSVGRenderableViewManager.createRNSVGEllipseViewManager(),
            RNSVGRenderableViewManager.createRNSVGLineViewManager(),
            RNSVGRenderableViewManager.createRNSVGRectViewManager(),
            RNSVGRenderableViewManager.createRNSVGTextViewManager(),
            RNSVGRenderableViewManager.createRNSVGImageViewManager(),
            RNSVGRenderableViewManager.createRNSVGClipPathViewManager(),
            RNSVGRenderableViewManager.createRNSVGDefsViewManager(),
            RNSVGRenderableViewManager.createRNSVGUseViewManager(),
            RNSVGRenderableViewManager.createRNSVGViewBoxViewManager(),
            RNSVGRenderableViewManager.createRNSVGLinearGradientManager(),
            RNSVGRenderableViewManager.createRNSVGRadialGradientManager(),
            new RNSVGSvgViewManager());
    }

    @Override
    public List<Class<? extends JavaScriptModule>> createJSModules() {
        return Collections.emptyList();
    }

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        return Collections.emptyList();
    }
}
