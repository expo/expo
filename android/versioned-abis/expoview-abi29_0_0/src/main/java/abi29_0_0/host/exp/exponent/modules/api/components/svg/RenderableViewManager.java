/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import android.view.View;

import abi29_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi29_0_0.com.facebook.react.uimanager.ViewManager;

/**
 * ViewManager for all shadowed RNSVG views: Group, Path and Text. Since these never get rendered
 * into native views and don't need any logic (all the logic is in {@link SvgView}), this
 * "stubbed" ViewManager is used for all of them.
 */
class RenderableViewManager extends ViewManager<View, LayoutShadowNode> {

    /* package */ private static final String CLASS_GROUP = "RNSVGGroup";
    /* package */ private static final String CLASS_PATH = "RNSVGPath";
    /* package */ private static final String CLASS_TEXT = "RNSVGText";
    /* package */ private static final String CLASS_TSPAN = "RNSVGTSpan";
    /* package */ private static final String CLASS_TEXT_PATH = "RNSVGTextPath";
    /* package */ private static final String CLASS_IMAGE = "RNSVGImage";
    /* package */ private static final String CLASS_CIRCLE = "RNSVGCircle";
    /* package */ private static final String CLASS_ELLIPSE = "RNSVGEllipse";
    /* package */ private static final String CLASS_LINE = "RNSVGLine";
    /* package */ private static final String CLASS_RECT = "RNSVGRect";
    /* package */ private static final String CLASS_CLIP_PATH = "RNSVGClipPath";
    /* package */ private static final String CLASS_DEFS = "RNSVGDefs";
    /* package */ private static final String CLASS_USE = "RNSVGUse";
    /* package */ private static final String CLASS_SYMBOL = "RNSVGSymbol";
    /* package */ private static final String CLASS_LINEAR_GRADIENT = "RNSVGLinearGradient";
    /* package */ private static final String CLASS_RADIAL_GRADIENT = "RNSVGRadialGradient";

    private final String mClassName;


    static RenderableViewManager createGroupViewManager() {
        return new RenderableViewManager(CLASS_GROUP);
    }

    static RenderableViewManager createPathViewManager() {
        return new RenderableViewManager(CLASS_PATH);
    }

    static RenderableViewManager createTextViewManager() {
        return new RenderableViewManager(CLASS_TEXT);
    }

    static RenderableViewManager createTSpanViewManager() {
        return new RenderableViewManager(CLASS_TSPAN);
    }

    static RenderableViewManager createTextPathViewManager() {
        return new RenderableViewManager(CLASS_TEXT_PATH);
    }

    static RenderableViewManager createImageViewManager() {
        return new RenderableViewManager(CLASS_IMAGE);
    }

    static RenderableViewManager createCircleViewManager() {
        return new RenderableViewManager(CLASS_CIRCLE);
    }

    static RenderableViewManager createEllipseViewManager() {
        return new RenderableViewManager(CLASS_ELLIPSE);
    }

    static RenderableViewManager createLineViewManager() {
        return new RenderableViewManager(CLASS_LINE);
    }

    static RenderableViewManager createRectViewManager() {
        return new RenderableViewManager(CLASS_RECT);
    }

    static RenderableViewManager createClipPathViewManager() {
        return new RenderableViewManager(CLASS_CLIP_PATH);
    }

    static RenderableViewManager createDefsViewManager() {
        return new RenderableViewManager(CLASS_DEFS);
    }

    static RenderableViewManager createUseViewManager() {
        return new RenderableViewManager(CLASS_USE);
    }

    static RenderableViewManager createSymbolManager() {
        return new RenderableViewManager(CLASS_SYMBOL);
    }

    static RenderableViewManager createLinearGradientManager() {
        return new RenderableViewManager(CLASS_LINEAR_GRADIENT);
    }

    static RenderableViewManager createRadialGradientManager() {
        return new RenderableViewManager(CLASS_RADIAL_GRADIENT);
    }

    private RenderableViewManager(String className) {
        mClassName = className;
    }

    @Override
    public String getName() {
        return mClassName;
    }

    @Override
    public LayoutShadowNode createShadowNodeInstance() {
        switch (mClassName) {
            case CLASS_GROUP:
                return new GroupShadowNode();
            case CLASS_PATH:
                return new PathShadowNode();
            case CLASS_CIRCLE:
                return new CircleShadowNode();
            case CLASS_ELLIPSE:
                return new EllipseShadowNode();
            case CLASS_LINE:
                return new LineShadowNode();
            case CLASS_RECT:
                return new RectShadowNode();
            case CLASS_TEXT:
                return new TextShadowNode();
            case CLASS_TSPAN:
                return new TSpanShadowNode();
            case CLASS_TEXT_PATH:
                return new TextPathShadowNode();
            case CLASS_IMAGE:
                return new ImageShadowNode();
            case CLASS_CLIP_PATH:
                return new ClipPathShadowNode();
            case CLASS_DEFS:
                return new DefsShadowNode();
            case CLASS_USE:
                return new UseShadowNode();
            case CLASS_SYMBOL:
                return new SymbolShadowNode();
            case CLASS_LINEAR_GRADIENT:
                return new LinearGradientShadowNode();
            case CLASS_RADIAL_GRADIENT:
                return new RadialGradientShadowNode();
            default:
                throw new IllegalStateException("Unexpected type " + mClassName);
        }
    }

    @Override
    public Class<? extends LayoutShadowNode> getShadowNodeClass() {
        switch (mClassName) {
            case CLASS_GROUP:
                return GroupShadowNode.class;
            case CLASS_PATH:
                return PathShadowNode.class;
            case CLASS_CIRCLE:
                return CircleShadowNode.class;
            case CLASS_ELLIPSE:
                return EllipseShadowNode.class;
            case CLASS_LINE:
                return LineShadowNode.class;
            case CLASS_RECT:
                return RectShadowNode.class;
            case CLASS_TEXT:
                return TextShadowNode.class;
            case CLASS_TSPAN:
                return TSpanShadowNode.class;
            case CLASS_TEXT_PATH:
                return TextPathShadowNode.class;
            case CLASS_IMAGE:
                return ImageShadowNode.class;
            case CLASS_CLIP_PATH:
                return ClipPathShadowNode.class;
            case CLASS_DEFS:
                return DefsShadowNode.class;
            case CLASS_USE:
                return UseShadowNode.class;
            case CLASS_SYMBOL:
                return SymbolShadowNode.class;
            case CLASS_LINEAR_GRADIENT:
                return LinearGradientShadowNode.class;
            case CLASS_RADIAL_GRADIENT:
                return RadialGradientShadowNode.class;
            default:
                throw new IllegalStateException("Unexpected type " + mClassName);
        }
    }

    @Override
    protected View createViewInstance(ThemedReactContext reactContext) {
        throw new IllegalStateException("SVG elements does not map into a native view");
    }

    @Override
    public void updateExtraData(View root, Object extraData) {
        throw new IllegalStateException("SVG elements does not map into a native view");
    }

    @Override
    public void onDropViewInstance(View view) {
    }
}
