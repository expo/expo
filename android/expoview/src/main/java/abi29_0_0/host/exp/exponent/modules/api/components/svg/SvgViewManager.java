/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Bitmap;
import android.util.SparseArray;

import abi29_0_0.com.facebook.yoga.YogaMeasureMode;
import abi29_0_0.com.facebook.yoga.YogaMeasureFunction;
import abi29_0_0.com.facebook.yoga.YogaNode;
import abi29_0_0.com.facebook.react.uimanager.BaseViewManager;
import abi29_0_0.com.facebook.react.uimanager.ThemedReactContext;

import javax.annotation.Nullable;

/**
 * ViewManager for RNSVGSvgView React views. Renders as a {@link SvgView} and handles
 * invalidating the native view on shadow view updates happening in the underlying tree.
 */
class SvgViewManager extends BaseViewManager<SvgView, SvgViewShadowNode> {

    private static final String REACT_CLASS = "RNSVGSvgView";

    private static final YogaMeasureFunction MEASURE_FUNCTION = new YogaMeasureFunction() {
        @Override
        public long measure(
                YogaNode node,
                float width,
                YogaMeasureMode widthMode,
                float height,
                YogaMeasureMode heightMode) {
            throw new IllegalStateException("SurfaceView should have explicit width and height set");
        }
    };

    private static final SparseArray<SvgViewShadowNode> mTagToShadowNode = new SparseArray<>();
    private static final SparseArray<SvgView> mTagToSvgView = new SparseArray<>();

    static void setShadowNode(SvgViewShadowNode shadowNode) {
        mTagToShadowNode.put(shadowNode.getReactTag(), shadowNode);
    }

    static void setSvgView(SvgView svg) {
        mTagToSvgView.put(svg.getId(), svg);
    }

    @SuppressWarnings("unused")
    static @Nullable SvgView getSvgViewByTag(int tag) {
        return mTagToSvgView.get(tag);
    }

    static @Nullable SvgViewShadowNode getShadowNodeByTag(int tag) {
        return mTagToShadowNode.get(tag);
    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public Class<SvgViewShadowNode> getShadowNodeClass() {
        return SvgViewShadowNode.class;
    }

    @Override
    public SvgViewShadowNode createShadowNodeInstance() {
        SvgViewShadowNode node = new SvgViewShadowNode();
        node.setMeasureFunction(MEASURE_FUNCTION);
        return node;
    }

    @Override
    public void onDropViewInstance(SvgView view) {
        int tag = view.getId();
        mTagToShadowNode.remove(tag);
        mTagToSvgView.remove(tag);
    }

    @Override
    protected SvgView createViewInstance(ThemedReactContext reactContext) {
        return new SvgView(reactContext);
    }

    @Override
    public void updateExtraData(SvgView root, Object extraData) {
        root.setBitmap((Bitmap) extraData);
    }

}
