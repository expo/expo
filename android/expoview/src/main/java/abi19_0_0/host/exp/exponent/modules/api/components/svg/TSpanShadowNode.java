/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi19_0_0.host.exp.exponent.modules.api.components.svg;


import android.annotation.TargetApi;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PointF;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Build;

import abi19_0_0.com.facebook.react.bridge.ReadableMap;
import abi19_0_0.com.facebook.react.uimanager.ReactShadowNode;
import abi19_0_0.com.facebook.react.uimanager.annotations.ReactProp;

import javax.annotation.Nullable;

/**
 * Shadow node for virtual TSpan view
 */
public class TSpanShadowNode extends TextShadowNode {

    private BezierTransformer mBezierTransformer;
    private Path mCache;
    private @Nullable String mContent;

    private static final String PROP_FONT_FAMILY = "fontFamily";
    private static final String PROP_FONT_SIZE = "fontSize";
    private static final String PROP_FONT_STYLE = "fontStyle";
    private static final String PROP_FONT_WEIGHT = "fontWeight";

    @ReactProp(name = "content")
    public void setContent(@Nullable String content) {
        mContent = content;
        markUpdated();
    }

    @Override
    public void draw(Canvas canvas, Paint paint, float opacity) {
        if (mContent != null) {
            drawPath(canvas, paint, opacity);
        } else {
            clip(canvas, paint);
            drawGroup(canvas, paint, opacity);
        }
    }

    @Override
    protected void releaseCachedPath() {
        mCache = null;
    }

    @Override
    protected Path getPath(Canvas canvas, Paint paint) {
        if (mCache != null) {
            return mCache;
        }

        String text = mContent;

        if (text == null) {
            return getGroupPath(canvas, paint);
        }

        setupTextPath();
        Path path = new Path();

        pushGlyphContext();
        applyTextPropertiesToPaint(paint);
        getLinePath(mContent + " ", paint, path);

        mCache = path;
        popGlyphContext();

        RectF box = new RectF();
        path.computeBounds(box, true);

        return path;
    }

    private Path getLinePath(String line, Paint paint, Path path) {
        float[] widths = new float[line.length()];
        paint.getTextWidths(line, widths);
        float glyphPosition = 0f;

        for (int index = 0; index < line.length(); index++) {
            String letter = line.substring(index, index + 1);
            Path glyph = new Path();
            float width = widths[index];

            paint.getTextPath(letter, 0, 1, 0, -paint.ascent(), glyph);
            PointF glyphPoint = getGlyphPointFromContext(glyphPosition, width);
            glyphPosition += width;
            Matrix matrix = new Matrix();

            if (mBezierTransformer != null) {
                matrix = mBezierTransformer.getTransformAtDistance(glyphPoint.x);

                if (textPathHasReachedEnd()) {
                    break;
                } else if (!textPathHasReachedStart()) {
                    continue;
                }

                matrix.postTranslate(0, glyphPoint.y);
            } else {
                matrix.setTranslate(glyphPoint.x, glyphPoint.y);
            }


            glyph.transform(matrix);
            path.addPath(glyph);
        }

        if (mBezierTransformer != null) {
            Matrix matrix = new Matrix();
            matrix.postTranslate(0, paint.ascent() * 1.1f);
            path.transform(matrix);
        }

        return path;
    }

    private void applyTextPropertiesToPaint(Paint paint) {
        ReadableMap font = getFontFromContext();

        paint.setTextAlign(Paint.Align.LEFT);

        float fontSize = (float)font.getDouble(PROP_FONT_SIZE);

        paint.setTextSize(fontSize * mScale);


        boolean isBold = font.hasKey(PROP_FONT_WEIGHT) && "bold".equals(font.getString(PROP_FONT_WEIGHT));
        boolean isItalic = font.hasKey(PROP_FONT_STYLE) && "italic".equals(font.getString(PROP_FONT_STYLE));

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

    private void setupTextPath() {
        ReactShadowNode parent = getParent();

        while (parent != null) {
            if (parent.getClass() == TextPathShadowNode.class) {
                TextPathShadowNode textPath = (TextPathShadowNode)parent;
                mBezierTransformer = textPath.getBezierTransformer();
                break;
            } else if (!(parent instanceof TextShadowNode)) {
                break;
            }

            parent = parent.getParent();
        }
    }

    private boolean textPathHasReachedEnd() {
        return mBezierTransformer.hasReachedEnd();
    }

    private boolean textPathHasReachedStart() {
        return mBezierTransformer.hasReachedStart();
    }
}
