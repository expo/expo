/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi24_0_0.host.exp.exponent.modules.api.components.svg;

import android.view.View;

import abi24_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi24_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi24_0_0.com.facebook.react.uimanager.ViewManager;

/**
 * ViewManager for all shadowed RNSVG views: Group, Path and Text. Since these never get rendered
 * into native views and don't need any logic (all the logic is in {@link SvgView}), this
 * "stubbed" ViewManager is used for all of them.
 */
public class RenderableViewManager extends ViewManager<View, LayoutShadowNode> {

    /* package */ static final String CLASS_GROUP = "RNSVGGroup";
    /* package */ static final String CLASS_PATH = "RNSVGPath";
    /* package */ static final String CLASS_TEXT = "RNSVGText";
    /* package */ static final String CLASS_TSPAN = "RNSVGTSpan";
    /* package */ static final String CLASS_TEXT_PATH = "RNSVGTextPath";
    /* package */ static final String CLASS_IMAGE = "RNSVGImage";
    /* package */ static final String CLASS_CIRCLE = "RNSVGCircle";
    /* package */ static final String CLASS_ELLIPSE = "RNSVGEllipse";
    /* package */ static final String CLASS_LINE = "RNSVGLine";
    /* package */ static final String CLASS_RECT = "RNSVGRect";
    /* package */ static final String CLASS_CLIP_PATH = "RNSVGClipPath";
    /* package */ static final String CLASS_DEFS = "RNSVGDefs";
    /* package */ static final String CLASS_USE = "RNSVGUse";
    /* package */ static final String CLASS_SYMBOL = "RNSVGSymbol";
    /* package */ static final String CLASS_LINEAR_GRADIENT = "RNSVGLinearGradient";
    /* package */ static final String CLASS_RADIAL_GRADIENT = "RNSVGRadialGradient";

    private final String mClassName;


    public static RenderableViewManager createGroupViewManager() {
        return new RenderableViewManager(CLASS_GROUP);
    }

    public static RenderableViewManager createPathViewManager() {
        return new RenderableViewManager(CLASS_PATH);
    }

    public static RenderableViewManager createTextViewManager() {
        return new RenderableViewManager(CLASS_TEXT);
    }

    public static RenderableViewManager createTSpanViewManager() {
        return new RenderableViewManager(CLASS_TSPAN);
    }

    public static RenderableViewManager createTextPathViewManager() {
        return new RenderableViewManager(CLASS_TEXT_PATH);
    }

    public static RenderableViewManager createImageViewManager() {
        return new RenderableViewManager(CLASS_IMAGE);
    }

    public static RenderableViewManager createCircleViewManager() {
        return new RenderableViewManager(CLASS_CIRCLE);
    }

    public static RenderableViewManager createEllipseViewManager() {
        return new RenderableViewManager(CLASS_ELLIPSE);
    }

    public static RenderableViewManager createLineViewManager() {
        return new RenderableViewManager(CLASS_LINE);
    }

    public static RenderableViewManager createRectViewManager() {
        return new RenderableViewManager(CLASS_RECT);
    }

    public static RenderableViewManager createClipPathViewManager() {
        return new RenderableViewManager(CLASS_CLIP_PATH);
    }

    public static RenderableViewManager createDefsViewManager() {
        return new RenderableViewManager(CLASS_DEFS);
    }

    public static RenderableViewManager createUseViewManager() {
        return new RenderableViewManager(CLASS_USE);
    }

    public static RenderableViewManager createSymbolManager() {
        return new RenderableViewManager(CLASS_SYMBOL);
    }

    public static RenderableViewManager createLinearGradientManager() {
        return new RenderableViewManager(CLASS_LINEAR_GRADIENT);
    }

    public static RenderableViewManager createRadialGradientManager() {
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
