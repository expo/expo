/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi9_0_0.host.exp.exponent.modules.api.components.svg;

import android.view.ViewGroup;

import abi9_0_0.com.facebook.react.uimanager.ThemedReactContext;
import abi9_0_0.com.facebook.react.uimanager.ViewGroupManager;

/**
 * ViewManager for all shadowed RNSVG views: Group, Path and Text. Since these never get rendered
 * into native views and don't need any logic (all the logic is in {@link RNSVGSvgView}), this
 * "stubbed" ViewManager is used for all of them.
 */
public class RNSVGRenderableViewManager extends ViewGroupManager<ViewGroup> {

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

    protected RNSVGVirtualNode mVirtualNode;

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
    public RNSVGVirtualNode createShadowNodeInstance() {
        switch (mClassName) {
            case CLASS_GROUP:
                mVirtualNode = new RNSVGGroupShadowNode();
                break;
            case CLASS_PATH:
                mVirtualNode = new RNSVGPathShadowNode();
                break;
            case CLASS_CIRCLE:
                mVirtualNode = new RNSVGCircleShadowNode();
                break;
            case CLASS_ELLIPSE:
                mVirtualNode = new RNSVGEllipseShadowNode();
                break;
            case CLASS_LINE:
                mVirtualNode = new RNSVGLineShadowNode();
                break;
            case CLASS_RECT:
                mVirtualNode = new RNSVGRectShadowNode();
                break;
            case CLASS_TEXT:
                mVirtualNode = new RNSVGTextShadowNode();
                break;
            case CLASS_IMAGE:
                mVirtualNode = new RNSVGImageShadowNode();
                break;
            case CLASS_CLIP_PATH:
                mVirtualNode = new RNSVGClipPathShadowNode();
                break;
            case CLASS_DEFS:
                mVirtualNode = new RNSVGDefsShadowNode();
                break;
            case CLASS_USE:
                mVirtualNode = new RNSVGUseShadowNode();
                break;
            case CLASS_VIEW_BOX:
                mVirtualNode = new RNSVGViewBoxShadowNode();
                break;
            case CLASS_LINEAR_GRADIENT:
                mVirtualNode = new RNSVGLinearGradientShadowNode();
                break;
            case CLASS_RADIAL_GRADIENT:
                mVirtualNode = new RNSVGRadialGradientShadowNode();
                break;
            default:
                throw new IllegalStateException("Unexpected type " + mClassName);
        }

        return mVirtualNode;

    }

    @Override
    public Class<? extends RNSVGVirtualNode> getShadowNodeClass() {
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
    protected ViewGroup createViewInstance(ThemedReactContext reactContext) {
        return new RNSVGRenderableView(reactContext);
    }
}
