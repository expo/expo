/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi12_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.Region;
import android.view.View;

import abi12_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi12_0_0.com.facebook.react.bridge.ReadableArray;
import abi12_0_0.com.facebook.react.uimanager.DisplayMetricsHolder;
import abi12_0_0.com.facebook.react.uimanager.LayoutShadowNode;
import abi12_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi12_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Base class for RNSVGView virtual nodes: {@link RNSVGGroupShadowNode}, {@link RNSVGPathShadowNode} and
 * indirectly for {@link RNSVGTextShadowNode}.
 */
public abstract class RNSVGVirtualNode extends LayoutShadowNode {

    protected static final float MIN_OPACITY_FOR_DRAW = 0.01f;

    private static final float[] sMatrixData = new float[9];
    private static final float[] sRawMatrix = new float[9];
    protected float mOpacity = 1f;
    protected Matrix mMatrix = new Matrix();

    protected @Nullable Path mClipPath;
    protected @Nullable String mClipPathRef;
    private static final int PATH_TYPE_CLOSE = 1;
    private static final int PATH_TYPE_CURVETO = 3;
    private static final int PATH_TYPE_LINETO = 2;
    private static final int PATH_TYPE_MOVETO = 0;

    private static final int CLIP_RULE_EVENODD = 0;
    private static final int CLIP_RULE_NONZERO = 1;
    protected final float mScale;
    private float[] mClipData;
    private int mClipRule;
    private boolean mClipRuleSet;
    private boolean mClipDataSet;
    protected boolean mResponsible;
    protected int mCanvasX;
    protected int mCanvasY;
    protected int mCanvasWidth;
    protected int mCanvasHeight;
    protected String mName;

    private RNSVGSvgViewShadowNode mSvgShadowNode;

    public RNSVGVirtualNode() {
        mScale = DisplayMetricsHolder.getScreenDisplayMetrics().density;
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
    protected final int saveAndSetupCanvas(Canvas canvas) {
        final int count = canvas.save();
        canvas.concat(mMatrix);
        return count;
    }

    /**
     * Restore the canvas after an element was drawn. This is always called in mirror with
     * {@link #saveAndSetupCanvas}.
     *
     * @param canvas the canvas to restore
     */
    protected void restoreCanvas(Canvas canvas, int count) {
        canvas.restoreToCount(count);
    }

    @ReactProp(name = "clipPath")
    public void setClipPath(@Nullable ReadableArray clipPath) {
        mClipData = PropHelper.toFloatArray(clipPath);
        mClipDataSet = true;
        setupClip();
        markUpdated();
    }

    @ReactProp(name = "name")
    public void setName(String name) {
        mName = name;
        markUpdated();
    }


    @ReactProp(name = "clipPathRef")
    public void setClipPathRef(String clipPathRef) {
        mClipPathRef = clipPathRef;
        markUpdated();
    }

    @ReactProp(name = "clipRule", defaultInt = CLIP_RULE_NONZERO)
    public void setClipRule(int clipRule) {
        mClipRule = clipRule;
        mClipRuleSet = true;
        setupClip();
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
            int matrixSize = PropHelper.toFloatArray(matrixArray, sMatrixData);
            if (matrixSize == 6) {
                setupMatrix();
            } else if (matrixSize != -1) {
                throw new JSApplicationIllegalArgumentException("Transform matrices must be of size 6");
            }
        } else {
            mMatrix = null;
        }
        markUpdated();
    }

    @ReactProp(name = "responsible", defaultBoolean = false)
    public void setResponsible(boolean responsible) {
        mResponsible = responsible;
        markUpdated();
    }

    private void setupClip() {
        if (mClipDataSet && mClipRuleSet) {
            mClipPath = new Path();

            switch (mClipRule) {
                case CLIP_RULE_EVENODD:
                    mClipPath.setFillType(Path.FillType.EVEN_ODD);
                    break;
                case CLIP_RULE_NONZERO:
                    break;
                default:
                    throw new JSApplicationIllegalArgumentException(
                        "clipRule " + mClipRule + " unrecognized");
            }
            createPath(mClipData, mClipPath);
        }
    }

    protected void setupMatrix() {
        sRawMatrix[0] = sMatrixData[0];
        sRawMatrix[1] = sMatrixData[2];
        sRawMatrix[2] = sMatrixData[4] * mScale;
        sRawMatrix[3] = sMatrixData[1];
        sRawMatrix[4] = sMatrixData[3];
        sRawMatrix[5] = sMatrixData[5] * mScale;
        sRawMatrix[6] = 0;
        sRawMatrix[7] = 0;
        sRawMatrix[8] = 1;
        mMatrix.setValues(sRawMatrix);
    }

    /**
     * Returns the floor modulus of the float arguments. Java modulus will return a negative remainder
     * when the divisor is negative. Modulus should always be positive. This mimics the behavior of
     * Math.floorMod, introduced in Java 8.
     */
    private float modulus(float x, float y) {
        float remainder = x % y;
        float ret = remainder;
        if (remainder < 0) {
            ret += y;
        }
        return ret;
    }

    /**
     * Creates a {@link Path} from an array of instructions constructed by JS
     * (see RNSVGSerializablePath.js). Each instruction starts with a type (see PATH_TYPE_*) followed
     * by arguments for that instruction. For example, to create a line the instruction will be
     * 2 (PATH_LINE_TO), x, y. This will draw a line from the last draw point (or 0,0) to x,y.
     *
     * @param data the array of instructions
     * @param path the {@link Path} that can be drawn to a canvas
     */
    protected void createPath(float[] data, Path path) {
        path.moveTo(0, 0);
        int i = 0;

        while (i < data.length) {
            int type = (int) data[i++];
            switch (type) {
                case PATH_TYPE_MOVETO:
                    path.moveTo(data[i++] * mScale, data[i++] * mScale);
                    break;
                case PATH_TYPE_CLOSE:
                    path.close();
                    break;
                case PATH_TYPE_LINETO:
                    path.lineTo(data[i++] * mScale, data[i++] * mScale);
                    break;
                case PATH_TYPE_CURVETO:
                    path.cubicTo(
                        data[i++] * mScale,
                        data[i++] * mScale,
                        data[i++] * mScale,
                        data[i++] * mScale,
                        data[i++] * mScale,
                        data[i++] * mScale);
                    break;
                default:
                    throw new JSApplicationIllegalArgumentException(
                        "Unrecognized drawing instruction " + type);
            }
        }
    }

    protected @Nullable Path getClipPath(Canvas canvas, Paint paint) {
        Path clip = mClipPath;
        if (clip == null && mClipPathRef != null) {
            RNSVGVirtualNode node = getSvgShadowNode().getDefinedClipPath(mClipPathRef);
            clip = node.getPath(canvas, paint);
        }

        return clip;
    }

    protected void clip(Canvas canvas, Paint paint) {
        Path clip = getClipPath(canvas, paint);

        if (clip != null) {
            canvas.clipPath(clip, Region.Op.REPLACE);
        }
    }

    abstract public int hitTest(Point point, View view, @Nullable Matrix matrix);

    abstract public int hitTest(Point point, View view);

    public boolean isResponsible() {
        return mResponsible;
    }

    abstract protected Path getPath(Canvas canvas, Paint paint);

    protected RNSVGSvgViewShadowNode getSvgShadowNode() {
        if (mSvgShadowNode != null) {
            return mSvgShadowNode;
        }

        ReactShadowNode parent = getParent();

        while (!(parent instanceof RNSVGSvgViewShadowNode)) {
            if (parent == null) {
                return null;
            } else {
                parent = parent.getParent();
            }
        }
        mSvgShadowNode = (RNSVGSvgViewShadowNode) parent;
        return mSvgShadowNode;
    }

    protected void setupDimensions(Canvas canvas) {
        Rect mCanvasClipBounds = canvas.getClipBounds();
        mCanvasX = mCanvasClipBounds.left;
        mCanvasY = mCanvasClipBounds.top;
        mCanvasWidth = canvas.getWidth();
        mCanvasHeight = canvas.getHeight();
    }

    protected void setupDimensions(Rect rect) {
        mCanvasX = rect.left;
        mCanvasY = rect.top;
        mCanvasWidth = rect.width();
        mCanvasHeight = rect.height();
    }

    protected void saveDefinition() {
        if (mName != null) {
            getSvgShadowNode().defineTemplate(this, mName);
        }
    }

    abstract public void mergeProperties(RNSVGVirtualNode target, ReadableArray mergeList, boolean inherited);

    abstract public void mergeProperties(RNSVGVirtualNode target, ReadableArray mergeList);

    abstract public void resetProperties();
}
