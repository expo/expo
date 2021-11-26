/*
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package com.horcrux.svg;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.DashPathEffect;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Region;

import com.facebook.react.bridge.Dynamic;
import com.facebook.react.bridge.JSApplicationIllegalArgumentException;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.uimanager.PointerEvents;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.annotation.Nullable;

@SuppressWarnings({"WeakerAccess", "RedundantSuppression"})
abstract public class RenderableView extends VirtualView {

    RenderableView(ReactContext reactContext) {
        super(reactContext);
        setPivotX(0);
        setPivotY(0);
    }

    static RenderableView contextElement;
    // strokeLinecap
    private static final int CAP_BUTT = 0;
    static final int CAP_ROUND = 1;
    private static final int CAP_SQUARE = 2;

    // strokeLinejoin
    private static final int JOIN_BEVEL = 2;
    private static final int JOIN_MITER = 0;
    static final int JOIN_ROUND = 1;

    // fillRule
    private static final int FILL_RULE_EVENODD = 0;
    static final int FILL_RULE_NONZERO = 1;

    // vectorEffect
    private static final int VECTOR_EFFECT_DEFAULT = 0;
    private static final int VECTOR_EFFECT_NON_SCALING_STROKE = 1;
    //static final int VECTOR_EFFECT_INHERIT = 2;
    //static final int VECTOR_EFFECT_URI = 3;

    /*
    Used in mergeProperties, keep public
    */

    public int vectorEffect = VECTOR_EFFECT_DEFAULT;
    public @Nullable ReadableArray stroke;
    public @Nullable SVGLength[] strokeDasharray;

    public SVGLength strokeWidth = new SVGLength(1);
    public float strokeOpacity = 1;
    public float strokeMiterlimit = 4;
    public float strokeDashoffset = 0;

    public Paint.Cap strokeLinecap = Paint.Cap.BUTT;
    public Paint.Join strokeLinejoin = Paint.Join.MITER;

    public @Nullable ReadableArray fill;
    public float fillOpacity = 1;
    public Path.FillType fillRule = Path.FillType.WINDING;

    /*
    End merged properties
    */
    private @Nullable ArrayList<String> mLastMergedList;
    private @Nullable ArrayList<Object> mOriginProperties;
    private @Nullable ArrayList<String> mPropList;
    private @Nullable ArrayList<String> mAttributeList;

    private static final Pattern regex = Pattern.compile("[0-9.-]+");

    @Override
    public void setId(int id) {
        super.setId(id);
        RenderableViewManager.setRenderableView(id, this);
    }

    @ReactProp(name = "vectorEffect")
    public void setVectorEffect(int vectorEffect) {
        this.vectorEffect = vectorEffect;
        invalidate();
    }

    @ReactProp(name = "fill")
    public void setFill(@Nullable Dynamic fill) {
        if (fill == null || fill.isNull()) {
            this.fill = null;
            invalidate();
            return;
        }
        ReadableType type = fill.getType();
        if (type.equals(ReadableType.Number)) {
            this.fill = JavaOnlyArray.of(0, fill.asInt());
        } else if (type.equals(ReadableType.Array)) {
            this.fill = fill.asArray();
        } else {
            JavaOnlyArray arr = new JavaOnlyArray();
            arr.pushInt(0);
            Matcher m = regex.matcher(fill.asString());
            int i = 0;
            while (m.find()) {
                double parsed = Double.parseDouble(m.group());
                arr.pushDouble(i++ < 3 ? parsed / 255 : parsed);
            }
            this.fill = arr;
        }
        invalidate();
    }

    @ReactProp(name = "fillOpacity", defaultFloat = 1f)
    public void setFillOpacity(float fillOpacity) {
        this.fillOpacity = fillOpacity;
        invalidate();
    }

    @ReactProp(name = "fillRule", defaultInt = FILL_RULE_NONZERO)
    public void setFillRule(int fillRule) {
        switch (fillRule) {
            case FILL_RULE_EVENODD:
                this.fillRule = Path.FillType.EVEN_ODD;
                break;
            case FILL_RULE_NONZERO:
                break;
            default:
                throw new JSApplicationIllegalArgumentException(
                        "fillRule " + fillRule + " unrecognized");
        }

        invalidate();
    }

    @ReactProp(name = "stroke")
    public void setStroke(@Nullable Dynamic strokeColors) {
        if (strokeColors == null || strokeColors.isNull()) {
            stroke = null;
            invalidate();
            return;
        }
        ReadableType type = strokeColors.getType();
        if (type.equals(ReadableType.Number)) {
            stroke = JavaOnlyArray.of(0, strokeColors.asInt());
        } else if (type.equals(ReadableType.Array)) {
            stroke = strokeColors.asArray();
        } else {
            JavaOnlyArray arr = new JavaOnlyArray();
            arr.pushInt(0);
            Matcher m = regex.matcher(strokeColors.asString());
            int i = 0;
            while (m.find()) {
                double parsed = Double.parseDouble(m.group());
                arr.pushDouble(i++ < 3 ? parsed / 255 : parsed);
            }
            stroke = arr;
        }
        invalidate();
    }

    @ReactProp(name = "strokeOpacity", defaultFloat = 1f)
    public void setStrokeOpacity(float strokeOpacity) {
        this.strokeOpacity = strokeOpacity;
        invalidate();
    }

    @ReactProp(name = "strokeDasharray")
    public void setStrokeDasharray(@Nullable ReadableArray strokeDasharray) {
        if (strokeDasharray != null) {
            int fromSize = strokeDasharray.size();
            this.strokeDasharray = new SVGLength[fromSize];
            for (int i = 0; i < fromSize; i++) {
                this.strokeDasharray[i] = SVGLength.from(strokeDasharray.getDynamic(i));
            }
        } else {
            this.strokeDasharray = null;
        }
        invalidate();
    }

    @ReactProp(name = "strokeDashoffset")
    public void setStrokeDashoffset(float strokeDashoffset) {
        this.strokeDashoffset = strokeDashoffset * mScale;
        invalidate();
    }

    @ReactProp(name = "strokeWidth")
    public void setStrokeWidth(Dynamic strokeWidth) {
        this.strokeWidth = SVGLength.from(strokeWidth);
        invalidate();
    }

    @ReactProp(name = "strokeMiterlimit", defaultFloat = 4f)
    public void setStrokeMiterlimit(float strokeMiterlimit) {
        this.strokeMiterlimit = strokeMiterlimit;
        invalidate();
    }

    @ReactProp(name = "strokeLinecap", defaultInt = CAP_ROUND)
    public void setStrokeLinecap(int strokeLinecap) {
        switch (strokeLinecap) {
            case CAP_BUTT:
                this.strokeLinecap = Paint.Cap.BUTT;
                break;
            case CAP_SQUARE:
                this.strokeLinecap = Paint.Cap.SQUARE;
                break;
            case CAP_ROUND:
                this.strokeLinecap = Paint.Cap.ROUND;
                break;
            default:
                throw new JSApplicationIllegalArgumentException(
                        "strokeLinecap " + strokeLinecap + " unrecognized");
        }
        invalidate();
    }

    @ReactProp(name = "strokeLinejoin", defaultInt = JOIN_ROUND)
    public void setStrokeLinejoin(int strokeLinejoin) {
        switch (strokeLinejoin) {
            case JOIN_MITER:
                this.strokeLinejoin = Paint.Join.MITER;
                break;
            case JOIN_BEVEL:
                this.strokeLinejoin = Paint.Join.BEVEL;
                break;
            case JOIN_ROUND:
                this.strokeLinejoin = Paint.Join.ROUND;
                break;
            default:
                throw new JSApplicationIllegalArgumentException(
                        "strokeLinejoin " + strokeLinejoin + " unrecognized");
        }
        invalidate();
    }

    @ReactProp(name = "propList")
    public void setPropList(@Nullable ReadableArray propList) {
        if (propList != null) {
            mPropList = mAttributeList = new ArrayList<>();
            for (int i = 0; i < propList.size(); i++) {
                mPropList.add(propList.getString(i));
            }
        }

        invalidate();
    }

    private static double saturate(double v) {
        return v <= 0 ? 0 : (v >= 1 ? 1 : v);
    }

    void render(Canvas canvas, Paint paint, float opacity) {
        MaskView mask = null;
        if (mMask != null) {
            SvgView root = getSvgView();
            mask = (MaskView) root.getDefinedMask(mMask);
        }
        if (mask != null) {
            Rect clipBounds = canvas.getClipBounds();
            int height = clipBounds.height();
            int width = clipBounds.width();

            Bitmap maskBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Bitmap original = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Bitmap result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);

            Canvas originalCanvas = new Canvas(original);
            Canvas maskCanvas = new Canvas(maskBitmap);
            Canvas resultCanvas = new Canvas(result);

            // Clip to mask bounds and render the mask
            float maskX = (float) relativeOnWidth(mask.mX);
            float maskY = (float) relativeOnHeight(mask.mY);
            float maskWidth = (float) relativeOnWidth(mask.mW);
            float maskHeight = (float) relativeOnHeight(mask.mH);
            maskCanvas.clipRect(maskX, maskY, maskWidth, maskHeight);

            Paint maskPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            mask.draw(maskCanvas, maskPaint, 1);

            // Apply luminanceToAlpha filter primitive https://www.w3.org/TR/SVG11/filters.html#feColorMatrixElement
            int nPixels = width * height;
            int[] pixels = new int[nPixels];
            maskBitmap.getPixels(pixels, 0, width, 0, 0, width, height);

            for (int i = 0; i < nPixels; i++) {
                int color = pixels[i];

                int r = (color >> 16) & 0xFF;
                int g = (color >> 8) & 0xFF;
                int b = color & 0xFF;
                int a = color >>> 24;

                double luminance = saturate(((0.299 * r) + (0.587 * g) + (0.144 * b)) / 255);
                int alpha = (int) (a * luminance);
                int pixel = (alpha << 24);
                pixels[i] = pixel;
            }

            maskBitmap.setPixels(pixels, 0, width, 0, 0, width, height);

            // Render content of current SVG Renderable to image
            draw(originalCanvas, paint, opacity);

            // Blend current element and mask
            maskPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.DST_IN));
            resultCanvas.drawBitmap(original, 0, 0, null);
            resultCanvas.drawBitmap(maskBitmap, 0, 0, maskPaint);

            // Render composited result into current render context
            canvas.drawBitmap(result, 0, 0, paint);
        } else {
            draw(canvas, paint, opacity);
        }
    }

    @Override
    void draw(Canvas canvas, Paint paint, float opacity) {
        opacity *= mOpacity;

        boolean computePaths = mPath == null;
        if (computePaths) {
            mPath = getPath(canvas, paint);
            mPath.setFillType(fillRule);
        }
        boolean nonScalingStroke = vectorEffect == VECTOR_EFFECT_NON_SCALING_STROKE;
        Path path = mPath;
        if (nonScalingStroke) {
            Path scaled = new Path();
            //noinspection deprecation
            mPath.transform(mCTM, scaled);
            canvas.setMatrix(null);
            path = scaled;
        }

        if (computePaths || path != mPath) {
            mBox = new RectF();
            path.computeBounds(mBox, true);
        }

        RectF clientRect = new RectF(mBox);
        mCTM.mapRect(clientRect);
        this.setClientRect(clientRect);

        clip(canvas, paint);

        if (setupFillPaint(paint, opacity * fillOpacity)) {
            if (computePaths) {
                mFillPath = new Path();
                paint.getFillPath(path, mFillPath);
            }
            canvas.drawPath(path, paint);
        }
        if (setupStrokePaint(paint, opacity * strokeOpacity)) {
            if (computePaths) {
                mStrokePath = new Path();
                paint.getFillPath(path, mStrokePath);
            }
            canvas.drawPath(path, paint);
        }
        renderMarkers(canvas, paint, opacity);
    }

    void renderMarkers(Canvas canvas, Paint paint, float opacity) {
        MarkerView markerStart = (MarkerView)getSvgView().getDefinedMarker(mMarkerStart);
        MarkerView markerMid = (MarkerView)getSvgView().getDefinedMarker(mMarkerMid);
        MarkerView markerEnd = (MarkerView)getSvgView().getDefinedMarker(mMarkerEnd);
        if (elements != null && (markerStart != null || markerMid != null  || markerEnd != null)) {
            contextElement = this;
            ArrayList<RNSVGMarkerPosition> positions = RNSVGMarkerPosition.fromPath(elements);
            float width = (float)(this.strokeWidth != null ? relativeOnOther(this.strokeWidth) : 1);
            mMarkerPath = new Path();
            for (RNSVGMarkerPosition position : positions) {
                RNSVGMarkerType type = position.type;
                MarkerView marker = null;
                switch (type) {
                    case kStartMarker:
                        marker = markerStart;
                        break;

                    case kMidMarker:
                        marker = markerMid;
                        break;

                    case kEndMarker:
                        marker = markerEnd;
                        break;
                }
                if (marker == null) {
                    continue;
                }
                marker.renderMarker(canvas, paint, opacity, position, width);
                Matrix transform = marker.markerTransform;
                mMarkerPath.addPath(marker.getPath(canvas, paint), transform);
            }
            contextElement = null;
        }
    }

    /**
     * Sets up paint according to the props set on a view. Returns {@code true}
     * if the fill should be drawn, {@code false} if not.
     */
    boolean setupFillPaint(Paint paint, float opacity) {
        if (fill != null && fill.size() > 0) {
            paint.reset();
            paint.setFlags(Paint.ANTI_ALIAS_FLAG | Paint.DEV_KERN_TEXT_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
            paint.setStyle(Paint.Style.FILL);
            setupPaint(paint, opacity, fill);
            return true;
        }
        return false;
    }

    /**
     * Sets up paint according to the props set on a view. Returns {@code true}
     * if the stroke should be drawn, {@code false} if not.
     */
    boolean setupStrokePaint(Paint paint, float opacity) {
        paint.reset();
        double strokeWidth = relativeOnOther(this.strokeWidth);
        if (strokeWidth == 0 || stroke == null || stroke.size() == 0) {
            return false;
        }

        paint.setFlags(Paint.ANTI_ALIAS_FLAG | Paint.DEV_KERN_TEXT_FLAG | Paint.SUBPIXEL_TEXT_FLAG);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeCap(strokeLinecap);
        paint.setStrokeJoin(strokeLinejoin);
        paint.setStrokeMiter(strokeMiterlimit * mScale);
        paint.setStrokeWidth((float) strokeWidth);
        setupPaint(paint, opacity, stroke);

        if (strokeDasharray != null) {
            int length = strokeDasharray.length;
            float[] intervals = new float[length];
            for (int i = 0; i < length; i++) {
                intervals[i] = (float)relativeOnOther(strokeDasharray[i]);
            }
            paint.setPathEffect(new DashPathEffect(intervals, strokeDashoffset));
        }

        return true;
    }

    private void setupPaint(Paint paint, float opacity, ReadableArray colors) {
        int colorType = colors.getInt(0);
        switch (colorType) {
            case 0:
                if (colors.size() == 2) {
                    int color = colors.getInt(1);
                    int alpha = color >>> 24;
                    int combined = Math.round((float)alpha * opacity);
                    paint.setColor(combined << 24 | (color & 0x00ffffff));
                } else {
                    // solid color
                    paint.setARGB(
                            (int) (colors.size() > 4 ? colors.getDouble(4) * opacity * 255 : opacity * 255),
                            (int) (colors.getDouble(1) * 255),
                            (int) (colors.getDouble(2) * 255),
                            (int) (colors.getDouble(3) * 255));
                }
                break;
            case 1: {
                Brush brush = getSvgView().getDefinedBrush(colors.getString(1));
                if (brush != null) {
                    brush.setupPaint(paint, mBox, mScale, opacity);
                }
                break;
            }
            case 2: {
                int brush = getSvgView().mTintColor;
                paint.setColor(brush);
                break;
            }
            case 3: {
                if (contextElement != null && contextElement.fill != null) {
                    setupPaint(paint, opacity, contextElement.fill);
                }
                break;
            }
            case 4: {
                if (contextElement != null && contextElement.stroke != null) {
                    setupPaint(paint, opacity, contextElement.stroke);
                }
                break;
            }
        }

    }

    abstract Path getPath(Canvas canvas, Paint paint);

    @Override
    int hitTest(final float[] src) {
        if (mPath == null || !mInvertible || !mTransformInvertible) {
            return -1;
        }

        if (mPointerEvents == PointerEvents.NONE) {
            return -1;
        }

        float[] dst = new float[2];
        mInvMatrix.mapPoints(dst, src);
        mInvTransform.mapPoints(dst);
        int x = Math.round(dst[0]);
        int y = Math.round(dst[1]);

        initBounds();

        if (
            (mRegion == null || !mRegion.contains(x, y)) &&
            (mStrokeRegion == null || !mStrokeRegion.contains(x, y) &&
            (mMarkerRegion == null || !mMarkerRegion.contains(x, y)))
        ) {
            return -1;
        }

        Path clipPath = getClipPath();
        if (clipPath != null) {
            if (!mClipRegion.contains(x, y)) {
                return -1;
            }
        }

        return getId();
    }

    void initBounds() {
        if (mRegion == null && mFillPath != null) {
            mFillBounds = new RectF();
            mFillPath.computeBounds(mFillBounds, true);
            mRegion = getRegion(mFillPath, mFillBounds);
        }
        if (mRegion == null && mPath != null) {
            mFillBounds = new RectF();
            mPath.computeBounds(mFillBounds, true);
            mRegion = getRegion(mPath, mFillBounds);
        }
        if (mStrokeRegion == null && mStrokePath != null) {
            mStrokeBounds = new RectF();
            mStrokePath.computeBounds(mStrokeBounds, true);
            mStrokeRegion = getRegion(mStrokePath, mStrokeBounds);
        }
        if (mMarkerRegion == null && mMarkerPath != null) {
            mMarkerBounds = new RectF();
            mMarkerPath.computeBounds(mMarkerBounds, true);
            mMarkerRegion = getRegion(mMarkerPath, mMarkerBounds);
        }
        Path clipPath = getClipPath();
        if (clipPath != null) {
            if (mClipRegionPath != clipPath) {
                mClipRegionPath = clipPath;
                mClipBounds = new RectF();
                clipPath.computeBounds(mClipBounds, true);
                mClipRegion = getRegion(clipPath, mClipBounds);
            }
        }
    }

    Region getRegion(Path path, RectF rectF) {
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

    void mergeProperties(RenderableView target) {
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

    private boolean hasOwnProperty(String propName) {
        return mAttributeList != null && mAttributeList.contains(propName);
    }
}
