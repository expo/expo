/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi29_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.RectF;

import abi29_0_0.com.facebook.react.bridge.ReadableMap;
import abi29_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi29_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Shadow node for virtual Group view
 */
class GroupShadowNode extends RenderableShadowNode {
    @Nullable ReadableMap mFont;

    private GlyphContext mGlyphContext;

    @ReactProp(name = "font")
    public void setFont(@Nullable ReadableMap font) {
        mFont = font;
        markUpdated();
    }

    void setupGlyphContext(Canvas canvas) {
        RectF clipBounds = new RectF(canvas.getClipBounds());
        mMatrix.mapRect(clipBounds);
        mGlyphContext = new GlyphContext(mScale, clipBounds.width(), clipBounds.height());
    }

    GlyphContext getGlyphContext() {
        return mGlyphContext;
    }

    @SuppressWarnings("ConstantConditions")
    GlyphContext getTextRootGlyphContext() {
        return getTextRoot().getGlyphContext();
    }

    void pushGlyphContext() {
        getTextRootGlyphContext().pushContext(this, mFont);
    }

    void popGlyphContext() {
        getTextRootGlyphContext().popContext();
    }

    public void draw(final Canvas canvas, final Paint paint, final float opacity) {
        setupGlyphContext(canvas);
        if (opacity > MIN_OPACITY_FOR_DRAW) {
            clip(canvas, paint);
            drawGroup(canvas, paint, opacity);
        }
    }

    void drawGroup(final Canvas canvas, final Paint paint, final float opacity) {
        pushGlyphContext();
        final SvgViewShadowNode svg = getSvgShadowNode();
        final GroupShadowNode self = this;
        traverseChildren(new NodeRunnable() {
            public void run(VirtualNode node) {
                if (node instanceof RenderableShadowNode) {
                    ((RenderableShadowNode)node).mergeProperties(self);
                }

                int count = node.saveAndSetupCanvas(canvas);
                node.draw(canvas, paint, opacity * mOpacity);
                node.restoreCanvas(canvas, count);

                if (node instanceof RenderableShadowNode) {
                    ((RenderableShadowNode)node).resetProperties();
                }

                node.markUpdateSeen();

                if (node.isResponsible()) {
                    svg.enableTouchEvents();
                }
            }
        });
        popGlyphContext();
    }

    void drawPath(Canvas canvas, Paint paint, float opacity) {
        super.draw(canvas, paint, opacity);
    }

    @Override
    protected Path getPath(final Canvas canvas, final Paint paint) {
        final Path path = new Path();

        traverseChildren(new NodeRunnable() {
            public void run(VirtualNode node) {
                path.addPath(node.getPath(canvas, paint));
            }
        });

        return path;
    }

    @Override
    public int hitTest(final Point point, final @Nullable Matrix matrix) {
        int hitSelf = super.hitTest(point, matrix);
        if (hitSelf != -1) {
            return hitSelf;
        }

        Matrix groupMatrix = new Matrix(mMatrix);

        if (matrix != null) {
            groupMatrix.postConcat(matrix);
        }

        Path clipPath = getClipPath();

        if (clipPath != null && !pathContainsPoint(clipPath, groupMatrix, point)) {
            return -1;
        }

        for (int i = getChildCount() - 1; i >= 0; i--) {
            ReactShadowNode child = getChildAt(i);
            if (!(child instanceof VirtualNode)) {
                continue;
            }

            VirtualNode node = (VirtualNode) child;

            int hitChild = node.hitTest(point, groupMatrix);
            if (hitChild != -1) {
                return (node.isResponsible() || hitChild != child.getReactTag()) ? hitChild : getReactTag();
            }
        }

        return -1;
    }

    void saveDefinition() {
        if (mName != null) {
            getSvgShadowNode().defineTemplate(this, mName);
        }

        traverseChildren(new NodeRunnable() {
            public void run(VirtualNode node) {
                node.saveDefinition();
            }
        });
    }

    @Override
    public void resetProperties() {
        traverseChildren(new NodeRunnable() {
            public void run(VirtualNode node) {
                if (node instanceof RenderableShadowNode) {
                    ((RenderableShadowNode)node).resetProperties();
                }
            }
        });
    }
}
