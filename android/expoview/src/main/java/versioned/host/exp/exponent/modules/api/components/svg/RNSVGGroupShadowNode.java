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

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.ReactShadowNode;


import javax.annotation.Nullable;

/**
 * Shadow node for virtual RNSVGGroup view
 */
public class RNSVGGroupShadowNode extends RNSVGPathShadowNode {

    public void draw(final Canvas canvas, final Paint paint, final float opacity) {
        final RNSVGSvgViewShadowNode svg = getSvgShadowNode();
        final RNSVGVirtualNode self = this;

        if (opacity > MIN_OPACITY_FOR_DRAW) {
            int count = saveAndSetupCanvas(canvas);
            clip(canvas, paint);

            traverseChildren(new NodeRunnable() {
                public boolean run(RNSVGVirtualNode node) {
                    node.setupDimensions(canvas);

                    node.mergeProperties(self, mOwnedPropList, true);
                    node.draw(canvas, paint, opacity * mOpacity);
                    node.markUpdateSeen();

                    if (node.isResponsible()) {
                        svg.enableTouchEvents();
                    }
                    return true;
                }
            });

            restoreCanvas(canvas, count);
        }
    }

    @Override
    protected Path getPath(final Canvas canvas, final Paint paint) {
        final Path path = new Path();

        traverseChildren(new NodeRunnable() {
            public boolean run(RNSVGVirtualNode node) {
                node.setupDimensions(canvas);
                path.addPath(node.getPath(canvas, paint));
                return true;
            }
        });

        return path;
    }

    @Override
    public int hitTest(final Point point, final @Nullable Matrix matrix) {
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

            int viewTag = node.hitTest(point, combinedMatrix);
            if (viewTag != -1) {
                return (node.isResponsible() || viewTag != child.getReactTag()) ? viewTag : getReactTag();
            }
        }

        return -1;
    }

    protected void saveDefinition() {
        if (mName != null) {
            getSvgShadowNode().defineTemplate(this, mName);
        }

        traverseChildren(new NodeRunnable() {
            public boolean run(RNSVGVirtualNode node) {
                node.saveDefinition();
                return true;
            }
        });
    }

    @Override
    public void mergeProperties(final RNSVGVirtualNode target, final ReadableArray mergeList) {
        traverseChildren(new NodeRunnable() {
            public boolean run(RNSVGVirtualNode node) {
                node.mergeProperties(target, mergeList);
                return true;
            }
        });
    }

    @Override
    public void resetProperties() {
        traverseChildren(new NodeRunnable() {
            public boolean run(RNSVGVirtualNode node) {
                node.resetProperties();
                return true;
            }
        });
    }
}
