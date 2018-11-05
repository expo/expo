/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi28_0_0.host.exp.exponent.modules.api.components.svg;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.RectF;
import android.graphics.Region;

import abi28_0_0.com.facebook.react.bridge.Arguments;
import abi28_0_0.com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import abi28_0_0.com.facebook.react.bridge.ReadableArray;
import abi28_0_0.com.facebook.react.bridge.WritableArray;
import abi28_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Renderable shadow node
 */
@SuppressWarnings("WeakerAccess")
abstract public class RenderableShadowNode extends VirtualNode {

    // strokeLinecap
    private static final int CAP_BUTT = 0;
    private static final int CAP_ROUND = 1;
    private static final int CAP_SQUARE = 2;

    // strokeLinejoin
    private static final int JOIN_BEVEL = 2;
    private static final int JOIN_MITER = 0;
    private static final int JOIN_ROUND = 1;

    // fillRule
    private static final int FILL_RULE_EVENODD = 0;
    private static final int FILL_RULE_NONZERO = 1;

    public @Nullable ReadableArray mStroke;
    public @Nullable String[] mStrokeDasharray;

    public String mStrokeWidth = "1";
    public float mStrokeOpacity = 1;
    public float mStrokeMiterlimit = 4;
    public float mStrokeDashoffset = 0;

    public Paint.Cap mStrokeLinecap = Paint.Cap.ROUND;
    public Paint.Join mStrokeLinejoin = Paint.Join.ROUND;

    public @Nullable ReadableArray mFill;
    public float mFillOpacity = 1;
    public Path.FillType mFillRule = Path.FillType.WINDING;

    protected Path mPath;

    private @Nullable ReadableArray mLastMergedList;
    private @Nullable ArrayList<Object> mOriginProperties;
    protected @Nullable ReadableArray mPropList;
    protected @Nullable WritableArray mAttributeList;

    @ReactProp(name = "fill")
    public void setFill(@Nullable ReadableArray fill) {
        mFill = fill;
        markUpdated();
    }

    @ReactProp(name = "fillOpacity", defaultFloat = 1f)
    public void setFillOpacity(float fillOpacity) {
        mFillOpacity = fillOpacity;
        markUpdated();
    }

    @ReactProp(name = "fillRule", defaultInt = FILL_RULE_NONZERO)
    public void setFillRule(int fillRule) {
        switch (fillRule) {
            case FILL_RULE_EVENODD:
                mFillRule = Path.FillType.EVEN_ODD;
                break;
            case FILL_RULE_NONZERO:
                break;
            default:
                throw new JSApplicationIllegalArgumentException(
                        "fillRule " + mFillRule + " unrecognized");
        }

        mPath = null;
        markUpdated();
    }

    @ReactProp(name = "stroke")
    public void setStroke(@Nullable ReadableArray strokeColors) {
        mStroke = strokeColors;
        markUpdated();
    }

    @ReactProp(name = "strokeOpacity", defaultFloat = 1f)
    public void setStrokeOpacity(float strokeOpacity) {
        mStrokeOpacity = strokeOpacity;
        markUpdated();
    }

    @ReactProp(name = "strokeDasharray")
    public void setStrokeDasharray(@Nullable ReadableArray strokeDasharray) {
        if (strokeDasharray != null) {
            int fromSize = strokeDasharray.size();
            mStrokeDasharray = new String[fromSize];
            for (int i = 0; i < fromSize; i++) {
                mStrokeDasharray[i] = strokeDasharray.getString(i);
            }
        } else {
            mStrokeDasharray = null;
        }
        markUpdated();
    }

    @ReactProp(name = "strokeDashoffset")
    public void setStrokeDashoffset(float strokeWidth) {
        mStrokeDashoffset = strokeWidth * mScale;
        markUpdated();
    }

    @ReactProp(name = "strokeWidth")
    public void setStrokeWidth(String strokeWidth) {
        mStrokeWidth = strokeWidth;
        markUpdated();
    }

    @ReactProp(name = "strokeMiterlimit", defaultFloat = 4f)
    public void setStrokeMiterlimit(float strokeMiterlimit) {
        mStrokeMiterlimit = strokeMiterlimit;
        markUpdated();
    }

    @ReactProp(name = "strokeLinecap", defaultInt = CAP_ROUND)
    public void setStrokeLinecap(int strokeLinecap) {
        switch (strokeLinecap) {
            case CAP_BUTT:
                mStrokeLinecap = Paint.Cap.BUTT;
                break;
            case CAP_SQUARE:
                mStrokeLinecap = Paint.Cap.SQUARE;
                break;
            case CAP_ROUND:
                mStrokeLinecap = Paint.Cap.ROUND;
                break;
            default:
                throw new JSApplicationIllegalArgumentException(
                        "strokeLinecap " + mStrokeLinecap + " unrecognized");
        }
        markUpdated();
    }

    @ReactProp(name = "strokeLinejoin", defaultInt = JOIN_ROUND)
    public void setStrokeLinejoin(int strokeLinejoin) {
        switch (strokeLinejoin) {
            case JOIN_MITER:
                mStrokeLinejoin = Paint.Join.MITER;
                break;
            case JOIN_BEVEL:
                mStrokeLinejoin = Paint.Join.BEVEL;
                break;
            case JOIN_ROUND:
                mStrokeLinejoin = Paint.Join.ROUND;
                break;
            default:
                throw new JSApplicationIllegalArgumentException(
                        "strokeLinejoin " + mStrokeLinejoin + " unrecognized");
        }
        markUpdated();
    }

    @ReactProp(name = "propList")
    public void setPropList(@Nullable ReadableArray propList) {
        if (propList != null) {
            WritableArray copy = Arguments.createArray();
            for (int i = 0; i < propList.size(); i++) {
                String fieldName = propertyNameToFieldName(propList.getString(i));
                copy.pushString(fieldName);
            }
            mPropList = mAttributeList = copy;
        }

        markUpdated();
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        opacity *= mOpacity;

        if (opacity > MIN_OPACITY_FOR_DRAW) {
            mPath = getPath(canvas, paint);
            mPath.setFillType(mFillRule);

            clip(canvas, paint);
            if (setupFillPaint(paint, opacity * mFillOpacity)) {
                canvas.drawPath(mPath, paint);
            }
            if (setupStrokePaint(paint, opacity * mStrokeOpacity)) {
                canvas.drawPath(mPath, paint);
            }
        }
    }

    /**
     * Sets up paint according to the props set on a shadow view. Returns {@code true}
     * if the fill should be drawn, {@code false} if not.
     */
    private boolean setupFillPaint(Paint paint, float opacity) {
        if (mFill != null && mFill.size() > 0) {
            paint.reset();
            paint.setFlags(Paint.ANTI_ALIAS_FLAG | Paint.DEV_KERN_TEXT_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
            paint.setStyle(Paint.Style.FILL);
            setupPaint(paint, opacity, mFill);
            return true;
        }
        return false;
    }

    /**
     * Sets up paint according to the props set on a shadow view. Returns {@code true}
     * if the stroke should be drawn, {@code false} if not.
     */
    private boolean setupStrokePaint(Paint paint, float opacity) {
        paint.reset();
        double strokeWidth = relativeOnOther(mStrokeWidth);
        if (strokeWidth == 0 || mStroke == null || mStroke.size() == 0) {
            return false;
        }

        paint.setFlags(Paint.ANTI_ALIAS_FLAG | Paint.DEV_KERN_TEXT_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(mStrokeLinecap);
        paint.setStrokeJoin(mStrokeLinejoin);
        paint.setStrokeMiter(mStrokeMiterlimit * mScale);
        paint.setStrokeWidth((float) strokeWidth);
        setupPaint(paint, opacity, mStroke);

        if (mStrokeDasharray != null) {
            int length = mStrokeDasharray.length;
            float[] intervals = new float[length];
            for (int i = 0; i < length; i++) {
                intervals[i] = (float)relativeOnOther(mStrokeDasharray[i]);
            }
            paint.setPathEffect(new DashPathEffect(intervals, mStrokeDashoffset));
        }

        return true;
    }


    private void setupPaint(Paint paint, float opacity, ReadableArray colors) {
        int colorType = colors.getInt(0);
        if (colorType == 0) {
            // solid color
            paint.setARGB(
                    (int) (colors.size() > 4 ? colors.getDouble(4) * opacity * 255 : opacity * 255),
                    (int) (colors.getDouble(1) * 255),
                    (int) (colors.getDouble(2) * 255),
                    (int) (colors.getDouble(3) * 255));
        } else if (colorType == 1) {
            RectF box = new RectF();
            mPath.computeBounds(box, true);

            Brush brush = getSvgShadowNode().getDefinedBrush(colors.getString(1));
            if (brush != null) {
                brush.setupPaint(paint, box, mScale, opacity);
            }
        }

    }


    abstract protected Path getPath(Canvas canvas, Paint paint);

    @Override
    public int hitTest(Point point, @Nullable Matrix matrix) {
        if (mPath == null) {
            return -1;
        }

        Matrix pathMatrix = new Matrix(mMatrix);

        if (matrix != null) {
            pathMatrix.postConcat(matrix);
        }

        if (pathContainsPoint(mPath, pathMatrix, point)) {
            Path clipPath = getClipPath();
            if (clipPath != null && !pathContainsPoint(clipPath, pathMatrix, point)) {
               return -1;
            }

            return getReactTag();
        } else{
            return -1;
        }
    }

    boolean pathContainsPoint(Path path, Matrix matrix, Point point) {
        Path copy = new Path(path);

        copy.transform(matrix);

        RectF rectF = new RectF();
        copy.computeBounds(rectF, true);
        Region region = new Region();
        region.setPath(copy, new Region((int) rectF.left, (int) rectF.top, (int) rectF.right, (int) rectF.bottom));

        return region.contains(point.x, point.y);
    }

    private WritableArray getAttributeList() {
        return mAttributeList;
    }

    void mergeProperties(RenderableShadowNode target) {
        WritableArray targetAttributeList = target.getAttributeList();

        if (targetAttributeList == null ||
                targetAttributeList.size() == 0) {
            return;
        }

        mOriginProperties = new ArrayList<>();
        mAttributeList = clonePropList();

        for (int i = 0, size = targetAttributeList.size(); i < size; i++) {
            try {
                String fieldName = targetAttributeList.getString(i);
                Field field = getClass().getField(fieldName);
                Object value = field.get(target);
                mOriginProperties.add(field.get(this));

                if (!hasOwnProperty(fieldName)) {
                    mAttributeList.pushString(fieldName);
                    field.set(this, value);
                }
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        }

        mLastMergedList = targetAttributeList;
    }

    void resetProperties() {
        if (mLastMergedList != null && mOriginProperties != null) {
            try {
                for (int i = mLastMergedList.size() - 1; i >= 0; i--) {
                    Field field = getClass().getField(mLastMergedList.getString(i));
                    field.set(this, mOriginProperties.get(i));
                }
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }

            mLastMergedList = null;
            mOriginProperties = null;
            mAttributeList = clonePropList();
        }
    }

    private @Nonnull WritableArray clonePropList() {
        WritableArray attributeList = Arguments.createArray();

        if (mPropList != null) {
            for (int i = 0; i < mPropList.size(); i++) {
                attributeList.pushString(mPropList.getString(i));
            }
        }

        return attributeList;
    }

    // convert propertyName something like fillOpacity to fieldName like mFillOpacity
    private String propertyNameToFieldName(String fieldName) {
        Pattern pattern = Pattern.compile("^(\\w)");
        Matcher matched = pattern.matcher(fieldName);
        StringBuffer sb = new StringBuffer("m");
        while (matched.find()) {
            matched.appendReplacement(sb, matched.group(1).toUpperCase());
        }
        matched.appendTail(sb);
        return sb.toString();
    }

    private boolean hasOwnProperty(String propName) {
        if (mAttributeList == null) {
            return false;
        }

        for (int i = mAttributeList.size() - 1; i >= 0; i--) {
            if (mAttributeList.getString(i).equals(propName)) {
                return true;
            }
        }
        return false;
    }
}
