/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.annotation.SuppressLint;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Region;
import android.os.Build;
import android.view.View;

import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.views.view.ReactViewGroup;

import javax.annotation.Nullable;

@SuppressLint("ViewConstructor")
class GroupView extends RenderableView {
    @Nullable ReadableMap mFont;
    private GlyphContext mGlyphContext;

    public GroupView(ReactContext reactContext) {
        super(reactContext);
    }

    @ReactProp(name = "font")
    public void setFont(@Nullable ReadableMap font) {
        mFont = font;
        invalidate();
    }

    void setupGlyphContext(Canvas canvas) {
        RectF clipBounds = new RectF(canvas.getClipBounds());
        if (mMatrix != null) {
            mMatrix.mapRect(clipBounds);
        }
        if (mTransform != null) {
            mTransform.mapRect(clipBounds);
        }
        mGlyphContext = new GlyphContext(mScale, clipBounds.width(), clipBounds.height());
    }

    GlyphContext getGlyphContext() {
        return mGlyphContext;
    }

    private static <T> T requireNonNull(T obj) {
        if (obj == null)
            throw new NullPointerException();
        return obj;
    }

    GlyphContext getTextRootGlyphContext() {
        return requireNonNull(getTextRoot()).getGlyphContext();
    }

    void pushGlyphContext() {
        getTextRootGlyphContext().pushContext(this, mFont);
    }

    void popGlyphContext() {
        getTextRootGlyphContext().popContext();
    }

    void draw(final Canvas canvas, final Paint paint, final float opacity) {
        setupGlyphContext(canvas);
        clip(canvas, paint);
        drawGroup(canvas, paint, opacity);
    }

    void drawGroup(final Canvas canvas, final Paint paint, final float opacity) {
        pushGlyphContext();
        final SvgView svg = getSvgView();
        final GroupView self = this;
        final RectF groupRect = new RectF();
        for (int i = 0; i < getChildCount(); i++) {
            View child = getChildAt(i);
            if (child instanceof MaskView) {
                continue;
            }
            if (child instanceof VirtualView) {
                VirtualView node = ((VirtualView)child);
                if ("none".equals(node.mDisplay)) {
                    continue;
                }
                if (node instanceof RenderableView) {
                    ((RenderableView)node).mergeProperties(self);
                }

                int count = node.saveAndSetupCanvas(canvas, mCTM);
                node.render(canvas, paint, opacity * mOpacity);
                RectF r = node.getClientRect();
                if (r != null) {
                    groupRect.union(r);
                }

                node.restoreCanvas(canvas, count);

                if (node instanceof RenderableView) {
                    ((RenderableView)node).resetProperties();
                }

                if (node.isResponsible()) {
                    svg.enableTouchEvents();
                }
            } else if (child instanceof SvgView) {
                SvgView svgView = (SvgView)child;
                svgView.drawChildren(canvas);
                if (svgView.isResponsible()) {
                    svg.enableTouchEvents();
                }
            }
        }
        this.setClientRect(groupRect);
        popGlyphContext();
    }

    void drawPath(Canvas canvas, Paint paint, float opacity) {
        super.draw(canvas, paint, opacity);
    }

    @Override
    Path getPath(final Canvas canvas, final Paint paint) {
        if (mPath != null) {
            return mPath;
        }
        mPath = new Path();

        for (int i = 0; i < getChildCount(); i++) {
            View node = getChildAt(i);
            if (node instanceof MaskView) {
                continue;
            }
            if (node instanceof VirtualView) {
                VirtualView n = (VirtualView)node;
                Matrix transform = n.mMatrix;
                mPath.addPath(n.getPath(canvas, paint), transform);
            }
        }

        return mPath;
    }

    Path getPath(final Canvas canvas, final Paint paint, final Region.Op op) {
        final Path path = new Path();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            final Path.Op pop = Path.Op.valueOf(op.name());
            for (int i = 0; i < getChildCount(); i++) {
                View node = getChildAt(i);
                if (node instanceof MaskView) {
                    continue;
                }
                if (node instanceof VirtualView) {
                    VirtualView n = (VirtualView)node;
                    Matrix transform = n.mMatrix;
                    Path p2;
                    if (n instanceof GroupView) {
                        p2 = ((GroupView)n).getPath(canvas, paint, op);
                    } else {
                        p2 = n.getPath(canvas, paint);
                    }
                    p2.transform(transform);
                    path.op(p2, pop);
                }
            }
        } else {
            Rect clipBounds = canvas.getClipBounds();
            final Region bounds = new Region(clipBounds);
            final Region r = new Region();
            for (int i = 0; i < getChildCount(); i++) {
                View node = getChildAt(i);
                if (node instanceof MaskView) {
                    continue;
                }
                if (node instanceof VirtualView) {
                    VirtualView n = (VirtualView)node;
                    Matrix transform = n.mMatrix;
                    Path p2;
                    if (n instanceof GroupView) {
                        p2 = ((GroupView)n).getPath(canvas, paint, op);
                    } else {
                        p2 = n.getPath(canvas, paint);
                    }
                    if (transform != null) {
                        p2.transform(transform);
                    }
                    Region r2 = new Region();
                    r2.setPath(p2, bounds);
                    r.op(r2, op);
                }
            }
            path.addPath(r.getBoundaryPath());
        }

        return path;
    }

    @Override
    int hitTest(final float[] src) {
        if (!mInvertible || !mTransformInvertible) {
            return -1;
        }

        float[] dst = new float[2];
        mInvMatrix.mapPoints(dst, src);
        mInvTransform.mapPoints(dst);

        int x = Math.round(dst[0]);
        int y = Math.round(dst[1]);

        Path clipPath = getClipPath();
        if (clipPath != null) {
            if (mClipRegionPath != clipPath) {
                mClipRegionPath = clipPath;
                mClipBounds = new RectF();
                clipPath.computeBounds(mClipBounds, true);
                mClipRegion = getRegion(clipPath, mClipBounds);
            }
            if (!mClipRegion.contains(x, y)) {
                return -1;
            }
        }

        for (int i = getChildCount() - 1; i >= 0; i--) {
            View child = getChildAt(i);
            if (child instanceof VirtualView) {
                if (child instanceof MaskView) {
                    continue;
                }

                VirtualView node = (VirtualView) child;

                int hitChild = node.hitTest(dst);
                if (hitChild != -1) {
                    return (node.isResponsible() || hitChild != child.getId()) ? hitChild : getId();
                }
            } else if (child instanceof SvgView) {
                SvgView node = (SvgView) child;

                int hitChild = node.reactTagForTouch(dst[0], dst[1]);
                if (hitChild != child.getId()) {
                    return hitChild;
                }
            }
        }

        return -1;
    }

    void saveDefinition() {
        if (mName != null) {
            getSvgView().defineTemplate(this, mName);
        }

        for (int i = 0; i < getChildCount(); i++) {
            View node = getChildAt(i);
            if (node instanceof VirtualView) {
                ((VirtualView)node).saveDefinition();
            }
        }
    }

    @Override
    void resetProperties() {
        for (int i = 0; i < getChildCount(); i++) {
            View node = getChildAt(i);
            if (node instanceof RenderableView) {
                ((RenderableView)node).resetProperties();
            }
        }
    }
}
