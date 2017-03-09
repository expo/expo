/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi15_0_0.host.exp.exponent.modules.api.components.svg;

import android.view.View;

import abi15_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi15_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi15_0_0.com.facebook.react.uimanager.ViewManager;

/**
 * ViewManager for all shadowed RNSVG views: Group, Path and Text. Since these never get rendered
 * into native views and don't need any logic (all the logic is in {@link RNSVGSvgView}), this
 * "stubbed" ViewManager is used for all of them.
 */
public class RNSVGRenderableViewManager extends ViewManager<View, LayoutShadowNode> {

    /* package */ static final String CLASS_GROUP = "RNSVGGroup";
    /* package */ static final String CLASS_PATH = "RNSVGPath";
    /* package */ static final String CLASS_TEXT = "RNSVGText";
    /* package */ static final String CLASS_IMAGE = "RNSVGImage";
    /* package */ static final String CLASS_CIRCLE = "RNSVGCircle";
    /* package */ static final String CLASS_ELLIPSE = "RNSVGEllipse";
    /* package */ static final String CLASS_LINE = "RNSVGLine";
    /* package */ static final String CLASS_RECT = "RNSVGRect";
    /* package */ static final String CLASS_CLIP_PATH = "RNSVGClipPath";
    /* package */ static final String CLASS_DEFS = "RNSVGDefs";
    /* package */ static final String CLASS_USE = "RNSVGUse";
    /* package */ static final String CLASS_VIEW_BOX = "RNSVGViewBox";
    /* package */ static final String CLASS_LINEAR_GRADIENT = "RNSVGLinearGradient";
    /* package */ static final String CLASS_RADIAL_GRADIENT = "RNSVGRadialGradient";

    private final String mClassName;


    public static RNSVGRenderableViewManager createRNSVGGroupViewManager() {
        return new RNSVGRenderableViewManager(CLASS_GROUP);
    }

    public static RNSVGRenderableViewManager createRNSVGPathViewManager() {
        return new RNSVGRenderableViewManager(CLASS_PATH);
    }

    public static RNSVGRenderableViewManager createRNSVGTextViewManager() {
        return new RNSVGRenderableViewManager(CLASS_TEXT);
    }

    public static RNSVGRenderableViewManager createRNSVGImageViewManager() {
        return new RNSVGRenderableViewManager(CLASS_IMAGE);
    }

    public static RNSVGRenderableViewManager createRNSVGCircleViewManager() {
        return new RNSVGRenderableViewManager(CLASS_CIRCLE);
    }

    public static RNSVGRenderableViewManager createRNSVGEllipseViewManager() {
        return new RNSVGRenderableViewManager(CLASS_ELLIPSE);
    }

    public static RNSVGRenderableViewManager createRNSVGLineViewManager() {
        return new RNSVGRenderableViewManager(CLASS_LINE);
    }

    public static RNSVGRenderableViewManager createRNSVGRectViewManager() {
        return new RNSVGRenderableViewManager(CLASS_RECT);
    }

    public static RNSVGRenderableViewManager createRNSVGClipPathViewManager() {
        return new RNSVGRenderableViewManager(CLASS_CLIP_PATH);
    }

    public static RNSVGRenderableViewManager createRNSVGDefsViewManager() {
        return new RNSVGRenderableViewManager(CLASS_DEFS);
    }

    public static RNSVGRenderableViewManager createRNSVGUseViewManager() {
        return new RNSVGRenderableViewManager(CLASS_USE);
    }

    public static RNSVGRenderableViewManager createRNSVGViewBoxViewManager() {
        return new RNSVGRenderableViewManager(CLASS_VIEW_BOX);
    }

    public static RNSVGRenderableViewManager createRNSVGLinearGradientManager() {
        return new RNSVGRenderableViewManager(CLASS_LINEAR_GRADIENT);
    }

    public static RNSVGRenderableViewManager createRNSVGRadialGradientManager() {
        return new RNSVGRenderableViewManager(CLASS_RADIAL_GRADIENT);
    }

    private RNSVGRenderableViewManager(String className) {
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
                return new RNSVGGroupShadowNode();
            case CLASS_PATH:
                return new RNSVGPathShadowNode();
            case CLASS_CIRCLE:
                return new RNSVGCircleShadowNode();
            case CLASS_ELLIPSE:
                return new RNSVGEllipseShadowNode();
            case CLASS_LINE:
                return new RNSVGLineShadowNode();
            case CLASS_RECT:
                return new RNSVGRectShadowNode();
            case CLASS_TEXT:
                return new RNSVGTextShadowNode();
            case CLASS_IMAGE:
                return new RNSVGImageShadowNode();
            case CLASS_CLIP_PATH:
                return new RNSVGClipPathShadowNode();
            case CLASS_DEFS:
                return new RNSVGDefsShadowNode();
            case CLASS_USE:
                return new RNSVGUseShadowNode();
            case CLASS_VIEW_BOX:
                return new RNSVGViewBoxShadowNode();
            case CLASS_LINEAR_GRADIENT:
                return new RNSVGLinearGradientShadowNode();
            case CLASS_RADIAL_GRADIENT:
                return new RNSVGRadialGradientShadowNode();
            default:
                throw new IllegalStateException("Unexpected type " + mClassName);
        }
    }

    @Override
    public Class<? extends LayoutShadowNode> getShadowNodeClass() {
        switch (mClassName) {
            case CLASS_GROUP:
                return RNSVGGroupShadowNode.class;
            case CLASS_PATH:
                return RNSVGPathShadowNode.class;
            case CLASS_CIRCLE:
                return RNSVGCircleShadowNode.class;
            case CLASS_ELLIPSE:
                return RNSVGEllipseShadowNode.class;
            case CLASS_LINE:
                return RNSVGLineShadowNode.class;
            case CLASS_RECT:
                return RNSVGRectShadowNode.class;
            case CLASS_TEXT:
                return RNSVGTextShadowNode.class;
            case CLASS_IMAGE:
                return RNSVGImageShadowNode.class;
            case CLASS_CLIP_PATH:
                return RNSVGClipPathShadowNode.class;
            case CLASS_DEFS:
                return RNSVGDefsShadowNode.class;
            case CLASS_USE:
                return RNSVGUseShadowNode.class;
            case CLASS_VIEW_BOX:
                return RNSVGViewBoxShadowNode.class;
            case CLASS_LINEAR_GRADIENT:
                return RNSVGLinearGradientShadowNode.class;
            case CLASS_RADIAL_GRADIENT:
                return RNSVGRadialGradientShadowNode.class;
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
}
