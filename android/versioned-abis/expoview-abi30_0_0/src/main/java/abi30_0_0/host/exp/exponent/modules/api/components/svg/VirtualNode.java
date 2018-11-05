/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi30_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.Region;

import com.facebook.common.logging.FLog;
import abi30_0_0.com.facebook.react.bridge.ReadableArray;
import abi30_0_0.com.facebook.react.common.ReactConstants;
import abi30_0_0.com.facebook.react.uimanager.DisplayMetricsHolder;
import abi30_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi30_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi30_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

import static abi30_0_0.host.exp.exponent.modules.api.components.svg.FontData.DEFAULT_FONT_SIZE;

abstract class VirtualNode extends LayoutShadowNode {
    /*
        N[1/Sqrt[2], 36]
        The inverse of the square root of 2.
        Provide enough digits for the 128-bit IEEE quad (36 significant digits).
    */
    private static final double M_SQRT1_2l = 0.707106781186547524400844362104849039;

    static final float MIN_OPACITY_FOR_DRAW = 0.01f;

    private static final float[] sRawMatrix = new float[]{
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    };
    float mOpacity = 1f;
    Matrix mMatrix = new Matrix();

    private int mClipRule;
    private @Nullable String mClipPath;

    private static final int CLIP_RULE_EVENODD = 0;
    private static final int CLIP_RULE_NONZERO = 1;

    final float mScale;
    private boolean mResponsible;
    String mName;

    private SvgViewShadowNode mSvgShadowNode;
    private Path mCachedClipPath;
    private GroupShadowNode mTextRoot;
    private float canvasHeight = -1;
    private float canvasWidth = -1;
    private GlyphContext glyphContext;

    VirtualNode() {
        mScale = DisplayMetricsHolder.getScreenDisplayMetrics().density;
    }

    @Override
    public boolean isVirtual() {
        return true;
    }

    @Nullable
    GroupShadowNode getTextRoot() {
        VirtualNode node = this;
        if (mTextRoot == null) {
            while (node != null) {
                if (node instanceof GroupShadowNode && ((GroupShadowNode) node).getGlyphContext() != null) {
                    mTextRoot = (GroupShadowNode)node;
                    break;
                }

                ReactShadowNode parent = node.getParent();

                if (!(parent instanceof VirtualNode)) {
                    node = null;
                } else {
                    node = (VirtualNode)parent;
                }
            }
        }

        return mTextRoot;
    }

    @Nullable
    GroupShadowNode getParentTextRoot() {
        ReactShadowNode parent = this.getParent();
        if (!(parent instanceof VirtualNode)) {
            return null;
        } else {
            return ((VirtualNode) parent).getTextRoot();
        }
    }


    private double getFontSizeFromContext() {
        GroupShadowNode root = getTextRoot();
        if (root == null) {
            return DEFAULT_FONT_SIZE;
        }

        if (glyphContext == null) {
            glyphContext = root.getGlyphContext();
        }

        return glyphContext.getFontSize();
    }

    public abstract void draw(Canvas canvas, Paint paint, float opacity);

    /**
     * Sets up the transform matrix on the canvas before an element is drawn.
     *
     * NB: for perf reasons this does not apply opacity, as that would mean creating a new canvas
     * layer (which allocates an offscreen bitmap) and having it composited afterwards. Instead, the
     * drawing code should apply opacity recursively.
     *
     * @param canvas the canvas to set up
     */
    int saveAndSetupCanvas(Canvas canvas) {
        int count = canvas.save();
        canvas.concat(mMatrix);
        return count;
    }

    /**
     * Restore the canvas after an element was drawn. This is always called in mirror with
     * {@link #saveAndSetupCanvas}.
     *
     * @param canvas the canvas to restore
     */
    void restoreCanvas(Canvas canvas, int count) {
        canvas.restoreToCount(count);
    }

    @ReactProp(name = "name")
    public void setName(String name) {
        mName = name;
        markUpdated();
    }


    @ReactProp(name = "clipPath")
    public void setClipPath(String clipPath) {
        mClipPath = clipPath;
        markUpdated();
    }

    @ReactProp(name = "clipRule", defaultInt = CLIP_RULE_NONZERO)
    public void clipRule(int clipRule) {
        mClipRule = clipRule;
        markUpdated();
    }

    @ReactProp(name = "opacity", defaultFloat = 1f)
    public void setOpacity(float opacity) {
        mOpacity = opacity;
        markUpdated();
    }

    @ReactProp(name = "matrix")
    public void setMatrix(@Nullable ReadableArray matrixArray) {
        if (matrixArray != null) {
            int matrixSize = PropHelper.toMatrixData(matrixArray, sRawMatrix, mScale);
            if (matrixSize == 6) {
                if (mMatrix == null) {
                    mMatrix = new Matrix();
                }
                mMatrix.setValues(sRawMatrix);
            } else if (matrixSize != -1) {
                FLog.w(ReactConstants.TAG, "RNSVG: Transform matrices must be of size 6");
            }
        } else {
            mMatrix = null;
        }

        markUpdated();
    }

    @ReactProp(name = "responsible")
    public void setResponsible(boolean responsible) {
        mResponsible = responsible;
        markUpdated();
    }

    @Nullable Path getClipPath() {
        return mCachedClipPath;
    }

    @Nullable Path getClipPath(Canvas canvas, Paint paint) {
        if (mClipPath != null) {
            VirtualNode node = getSvgShadowNode().getDefinedClipPath(mClipPath);

            if (node != null) {
                Path clipPath = node.getPath(canvas, paint);
                switch (mClipRule) {
                    case CLIP_RULE_EVENODD:
                        clipPath.setFillType(Path.FillType.EVEN_ODD);
                        break;
                    case CLIP_RULE_NONZERO:
                        break;
                    default:
                        FLog.w(ReactConstants.TAG, "RNSVG: clipRule: " + mClipRule + " unrecognized");
                }
                mCachedClipPath = clipPath;
            } else {
                FLog.w(ReactConstants.TAG, "RNSVG: Undefined clipPath: " + mClipPath);
            }
        }

        return getClipPath();
    }

    void clip(Canvas canvas, Paint paint) {
        Path clip = getClipPath(canvas, paint);

        if (clip != null) {
            canvas.clipPath(clip, Region.Op.REPLACE);
        }
    }

    abstract public int hitTest(Point point, @Nullable Matrix matrix);

    public boolean isResponsible() {
        return mResponsible;
    }

    abstract protected Path getPath(Canvas canvas, Paint paint);

    SvgViewShadowNode getSvgShadowNode() {
        if (mSvgShadowNode != null) {
            return mSvgShadowNode;
        }

        ReactShadowNode parent = getParent();

        if (parent instanceof SvgViewShadowNode) {
            mSvgShadowNode = (SvgViewShadowNode)parent;
        } else if (parent instanceof VirtualNode) {
            mSvgShadowNode = ((VirtualNode) parent).getSvgShadowNode();
        } else {
            FLog.e(ReactConstants.TAG, "RNSVG: " + getClass().getName() + " should be descendant of a SvgViewShadow.");
        }

        return mSvgShadowNode;
    }

    double relativeOnWidth(String length) {
        return PropHelper.fromRelative(length, getCanvasWidth(), 0, mScale, getFontSizeFromContext());
    }

    double relativeOnHeight(String length) {
        return PropHelper.fromRelative(length, getCanvasHeight(), 0, mScale, getFontSizeFromContext());
    }

    double relativeOnOther(String length) {
        double powX = Math.pow((getCanvasWidth()), 2);
        double powY = Math.pow((getCanvasHeight()), 2);
        double r = Math.sqrt(powX + powY) * M_SQRT1_2l;
        return PropHelper.fromRelative(length, r, 0, mScale, getFontSizeFromContext());
    }

    private float getCanvasWidth() {
        if (canvasWidth != -1) {
            return canvasWidth;
        }
        GroupShadowNode root = getTextRoot();
        if (root == null) {
            canvasWidth = getSvgShadowNode().getCanvasBounds().width();
        } else {
            canvasWidth = root.getGlyphContext().getWidth();
        }

        return canvasWidth;
    }

    private float getCanvasHeight() {
        if (canvasHeight != -1) {
            return canvasHeight;
        }
        GroupShadowNode root = getTextRoot();
        if (root == null) {
            canvasHeight = getSvgShadowNode().getCanvasBounds().height();
        } else {
            canvasHeight = root.getGlyphContext().getHeight();
        }

        return canvasHeight;
    }

    void saveDefinition() {
        if (mName != null) {
            getSvgShadowNode().defineTemplate(this, mName);
        }
    }

    interface NodeRunnable {
        void run(VirtualNode node);
    }

    void traverseChildren(NodeRunnable runner) {
        for (int i = 0; i < getChildCount(); i++) {
            ReactShadowNode child = getChildAt(i);
            if (!(child instanceof VirtualNode)) {
                continue;
            }

            runner.run((VirtualNode) child);
        }
    }
}
