/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package versioned.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ReactShadowNode;


import javax.annotation.Nullable;

/**
 * Shadow node for virtual RNSVGGroup view
 */
public class RNSVGGroupShadowNode extends RNSVGPathShadowNode {

    public void draw(Canvas canvas, Paint paint, float opacity) {
        RNSVGSvgViewShadowNode svg = getSvgShadowNode();

        if (opacity > MIN_OPACITY_FOR_DRAW) {
            int count = saveAndSetupCanvas(canvas);
            clip(canvas, paint);
            for (int i = 0; i < getChildCount(); i++) {
                if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                    continue;
                }

                RNSVGVirtualNode child = (RNSVGVirtualNode) getChildAt(i);
                child.setupDimensions(canvas);

                child.mergeProperties(this, mPropList, true);
                child.draw(canvas, paint, opacity * mOpacity);

                if (child.isResponsible()) {
                    svg.enableTouchEvents();
                }
            }

            restoreCanvas(canvas, count);
        }
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();

        for (int i = 0; i < getChildCount(); i++) {
            if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                continue;
            }

            RNSVGVirtualNode child = (RNSVGVirtualNode) getChildAt(i);
            child.setupDimensions(canvas);
            path.addPath(child.getPath(canvas, paint));
        }
        return path;
    }

    @Override
    public int hitTest(Point point, View view, @Nullable Matrix matrix) {
        int viewTag = -1;
        Matrix combinedMatrix = new Matrix();

        if (matrix != null) {
            combinedMatrix.postConcat(matrix);
        }

        combinedMatrix.postConcat(mMatrix);

        for (int i = getChildCount() - 1; i >= 0; i--) {
            ReactShadowNode child = getChildAt(i);
            if (!(child instanceof RNSVGVirtualNode)) {
                continue;
            }

            RNSVGVirtualNode node = (RNSVGVirtualNode) child;

            View childView = ((ViewGroup) view).getChildAt(i);
            viewTag = node.hitTest(point, childView, combinedMatrix);
            if (viewTag != -1) {
                return (node.isResponsible() || viewTag != childView.getId()) ? viewTag : view.getId();
            }
        }

        return viewTag;
    }

    @Override
    public int hitTest(Point point, View view) {
        return this.hitTest(point, view, null);
    }

    protected void saveDefinition() {
        if (mName != null) {
            getSvgShadowNode().defineTemplate(this, mName);
        }

        for (int i = getChildCount() - 1; i >= 0; i--) {
            if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                continue;
            }

            ((RNSVGVirtualNode) getChildAt(i)).saveDefinition();
        }
    }

    @Override
    public void mergeProperties(RNSVGVirtualNode target, ReadableArray mergeList) {
        if (mergeList.size() != 0) {
            for (int i = getChildCount() - 1; i >= 0; i--) {
                if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                    continue;
                }

                ((RNSVGVirtualNode) getChildAt(i)).mergeProperties(target, mergeList);
            }
        }
    }

    @Override
    public void resetProperties() {
        for (int i = getChildCount() - 1; i >= 0; i--) {
            if (!(getChildAt(i) instanceof RNSVGVirtualNode)) {
                continue;
            }

            ((RNSVGVirtualNode) getChildAt(i)).resetProperties();
        }
    }
}
