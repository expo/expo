/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi14_0_0.host.exp.exponent.modules.api.components.svg;

import javax.annotation.Nullable;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.text.TextUtils;

import abi14_0_0.com.facebook.react.bridge.ReadableArray;
import abi14_0_0.com.facebook.react.bridge.ReadableMap;
import abi14_0_0.com.facebook.react.uimanager.annotations.ReactProp;

/**
 * Shadow node for virtual RNSVGText view
 */
public class RNSVGTextShadowNode extends RNSVGPathShadowNode {

    private static final String PROP_LINES = "lines";

    private static final String PROP_FONT = "font";
    private static final String PROP_FONT_FAMILY = "fontFamily";
    private static final String PROP_FONT_SIZE = "fontSize";
    private static final String PROP_FONT_STYLE = "fontStyle";
    private static final String PROP_FONT_WEIGHT = "fontWeight";

    private static final int DEFAULT_FONT_SIZE = 12;

    private static final int TEXT_ALIGNMENT_CENTER = 2;
    private static final int TEXT_ALIGNMENT_LEFT = 0;
    private static final int TEXT_ALIGNMENT_RIGHT = 1;

    private @Nullable ReadableMap mFrame;
    private int mTextAlignment = TEXT_ALIGNMENT_LEFT;
    private Path mTextPath;

    @ReactProp(name = "frame")
    public void setFrame(@Nullable ReadableMap frame) {
        mFrame = frame;
        markUpdated();
    }

    @ReactProp(name = "alignment", defaultInt = TEXT_ALIGNMENT_LEFT)
    public void setAlignment(int alignment) {
        mTextAlignment = alignment;
    }

    @ReactProp(name = "path")
    public void setPath(@Nullable ReadableArray textPath) {
        float[] pathData = PropHelper.toFloatArray(textPath);
        mTextPath = new Path();
        super.createPath(pathData, mTextPath);
        markUpdated();
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        opacity *= mOpacity;
        if (opacity > MIN_OPACITY_FOR_DRAW) {
            String text = formatText();
            if (text == null) {
                return;
            }

            // only set up the canvas if we have something to draw
            int count = saveAndSetupCanvas(canvas);
            clip(canvas, paint);
            RectF box = getBox(paint, text);

            if (setupStrokePaint(paint, opacity, box)) {
                drawText(canvas, paint, text);
            }
            if (setupFillPaint(paint, opacity, box)) {
                drawText(canvas, paint, text);
            }

            restoreCanvas(canvas, count);
            markUpdateSeen();
        }
    }

    private void drawText(Canvas canvas, Paint paint, String text) {
        applyTextPropertiesToPaint(paint);

        if (mTextPath == null) {
            canvas.drawText(text, 0, -paint.ascent(), paint);
        } else {
            Matrix matrix = new Matrix();
            matrix.setTranslate(0, -paint.getTextSize() * 1.1f);
            mTextPath.transform(matrix);
            canvas.drawTextOnPath(text, mTextPath, 0, -paint.ascent(), paint);
        }
    }

    private String formatText() {
        if (mFrame == null || !mFrame.hasKey(PROP_LINES)) {
            return null;
        }

        ReadableArray linesProp = mFrame.getArray(PROP_LINES);
        if (linesProp == null || linesProp.size() == 0) {
            return null;
        }

        String[] lines = new String[linesProp.size()];
        for (int i = 0; i < lines.length; i++) {
            lines[i] = linesProp.getString(i);
        }
        return TextUtils.join("\n", lines);
    }

    private RectF getBox(Paint paint, String text) {
        Rect bound = new Rect();
        paint.getTextBounds(text, 0, text.length(), bound);
        return new RectF(bound);
    }

    private void applyTextPropertiesToPaint(Paint paint) {
        int alignment = mTextAlignment;
        switch (alignment) {
            case TEXT_ALIGNMENT_LEFT:
                paint.setTextAlign(Paint.Align.LEFT);
                break;
            case TEXT_ALIGNMENT_RIGHT:
                paint.setTextAlign(Paint.Align.RIGHT);
                break;
            case TEXT_ALIGNMENT_CENTER:
                paint.setTextAlign(Paint.Align.CENTER);
                break;
        }
        if (mFrame != null) {
            if (mFrame.hasKey(PROP_FONT)) {
                ReadableMap font = mFrame.getMap(PROP_FONT);
                if (font != null) {
                    float fontSize = DEFAULT_FONT_SIZE;
                    if (font.hasKey(PROP_FONT_SIZE)) {
                        fontSize = (float) font.getDouble(PROP_FONT_SIZE);
                    }
                    paint.setTextSize(fontSize * mScale);
                    boolean isBold =
                        font.hasKey(PROP_FONT_WEIGHT) && "bold".equals(font.getString(PROP_FONT_WEIGHT));
                    boolean isItalic =
                        font.hasKey(PROP_FONT_STYLE) && "italic".equals(font.getString(PROP_FONT_STYLE));
                    int fontStyle;
                    if (isBold && isItalic) {
                        fontStyle = Typeface.BOLD_ITALIC;
                    } else if (isBold) {
                        fontStyle = Typeface.BOLD;
                    } else if (isItalic) {
                        fontStyle = Typeface.ITALIC;
                    } else {
                        fontStyle = Typeface.NORMAL;
                    }
                    // NB: if the font family is null / unsupported, the default one will be used
                    paint.setTypeface(Typeface.create(font.getString(PROP_FONT_FAMILY), fontStyle));
                }
            }
        }
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        Path path = new Path();

        String text = formatText();
        if (text == null) {
            return path;
        }

        // TODO: get path while TextPath is set.
        if (setupFillPaint(paint, 1.0f, getBox(paint, text))) {
            applyTextPropertiesToPaint(paint);
            paint.getTextPath(text, 0, text.length(), 0, -paint.ascent(), path);
            path.transform(mMatrix);
        }

        return path;
    }

    @Override
    public int hitTest(Point point, @Nullable Matrix matrix) {
        Bitmap bitmap = Bitmap.createBitmap(
            mCanvasWidth,
            mCanvasHeight,
            Bitmap.Config.ARGB_8888);

        Canvas canvas = new Canvas(bitmap);

        if (matrix != null) {
            canvas.concat(matrix);
        }

        canvas.concat(mMatrix);

        String text = formatText();
        if (text == null) {
            return -1;
        }

        Paint paint = new Paint();
        clip(canvas, paint);
        setHitTestFill(paint);
        drawText(canvas, paint, text);

        if (setHitTestStroke(paint)) {
            drawText(canvas, paint, text);
        }

        canvas.setBitmap(bitmap);
        try {
            if (bitmap.getPixel(point.x, point.y) != 0) {
                return getReactTag();
            }
        } catch (Exception e) {
            return -1;
        } finally {
            bitmap.recycle();
        }
        return -1;
    }
}
