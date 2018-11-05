/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package versioned.host.exp.exponent.modules.api.components.svg;

import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Region;

import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.uimanager.OnLayoutEvent;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.events.EventDispatcher;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.annotation.Nullable;

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

    private @Nullable ArrayList<String> mLastMergedList;
    private @Nullable ArrayList<Object> mOriginProperties;
    protected @Nullable ArrayList<String> mPropList;
    protected @Nullable ArrayList<String> mAttributeList;

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
            mPropList = mAttributeList = new ArrayList<>();
            for (int i = 0; i < propList.size(); i++) {
                String fieldName = propertyNameToFieldName(propList.getString(i));
                mPropList.add(fieldName);
            }
        }

        markUpdated();
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        opacity *= mOpacity;

        if (opacity > MIN_OPACITY_FOR_DRAW) {
            if (mPath == null) {
                mPath = getPath(canvas, paint);
                mPath.setFillType(mFillRule);
            }

            RectF clientRect = new RectF();
            mPath.computeBounds(clientRect, true);
            Matrix svgToViewMatrix = new Matrix(canvas.getMatrix());
            svgToViewMatrix.mapRect(clientRect);
            this.setClientRect(clientRect);

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
            Brush brush = getSvgShadowNode().getDefinedBrush(colors.getString(1));
            if (brush != null) {
                if (mBox == null) {
                    mBox = new RectF();
                    mPath.computeBounds(mBox, true);
                }
                brush.setupPaint(paint, mBox, mScale, opacity);
            }
        }

    }

    abstract protected Path getPath(Canvas canvas, Paint paint);

    @Override
    public int hitTest(final float[] src) {
        if (mPath == null || !mInvertible) {
            return -1;
        }

        float[] dst = new float[2];
        mInvMatrix.mapPoints(dst, src);
        int x = Math.round(dst[0]);
        int y = Math.round(dst[1]);

        if (mRegion == null && mPath != null) {
            mRegion = getRegion(mPath);
        }
        if (mRegion == null || !mRegion.contains(x, y)) {
            return -1;
        }

        Path clipPath = getClipPath();
        if (clipPath != null) {
            if (mClipRegionPath != clipPath) {
                mClipRegionPath = clipPath;
                mClipRegion = getRegion(clipPath);
            }
            if (!mClipRegion.contains(x, y)) {
                return -1;
            }
        }

        return getReactTag();
    }

    Region getRegion(Path path) {
        RectF rectF = new RectF();
        path.computeBounds(rectF, true);

        Region region = new Region();
        region.setPath(path,
                new Region(
                        (int) Math.floor(rectF.left),
                        (int) Math.floor(rectF.top),
                        (int) Math.ceil(rectF.right),
                        (int) Math.ceil(rectF.bottom)
                )
        );

        return region;
    }

    private ArrayList<String> getAttributeList() {
        return mAttributeList;
    }

    void mergeProperties(RenderableShadowNode target) {
        ArrayList<String> targetAttributeList = target.getAttributeList();

        if (targetAttributeList == null ||
                targetAttributeList.size() == 0) {
            return;
        }

        mOriginProperties = new ArrayList<>();
        mAttributeList = mPropList == null ? new ArrayList<String>() : new ArrayList<>(mPropList);

        for (int i = 0, size = targetAttributeList.size(); i < size; i++) {
            try {
                String fieldName = targetAttributeList.get(i);
                Field field = getClass().getField(fieldName);
                Object value = field.get(target);
                mOriginProperties.add(field.get(this));

                if (!hasOwnProperty(fieldName)) {
                    mAttributeList.add(fieldName);
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
                    Field field = getClass().getField(mLastMergedList.get(i));
                    field.set(this, mOriginProperties.get(i));
                }
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }

            mLastMergedList = null;
            mOriginProperties = null;
            mAttributeList = mPropList;
        }
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
        return mAttributeList != null && mAttributeList.contains(propName);
    }
}
