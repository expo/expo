/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi19_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.PointF;

import abi19_0_0.com.facebook.react.bridge.Arguments;
import abi19_0_0.com.facebook.react.bridge.ReadableArray;
import abi19_0_0.com.facebook.react.bridge.ReadableMap;
import abi19_0_0.com.facebook.react.bridge.WritableMap;

import java.util.ArrayList;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

public class GlyphContext {

    private ArrayList<ReadableMap> mFontContext;
    private ArrayList<PointF> mLocationContext;
    private ArrayList<ArrayList<Float>> mDeltaXContext;
    private ArrayList<ArrayList<Float>> mDeltaYContext;
    private ArrayList<Float> mXContext;
    private @Nonnull PointF mCurrentLocation;
    private float mScale;
    private float mWidth;
    private float mHeight;
    private int mContextLength = 0;
    private static final float DEFAULT_FONT_SIZE = 12f;

    GlyphContext(float scale, float width, float height) {
        mScale = scale;
        mWidth = width;
        mHeight = height;
        mCurrentLocation = new PointF();
        mFontContext = new ArrayList<>();
        mLocationContext = new ArrayList<>();
        mDeltaXContext = new ArrayList<>();
        mDeltaYContext = new ArrayList<>();
        mXContext = new ArrayList<>();
    }

    public void pushContext(@Nullable ReadableMap font, @Nullable ReadableArray deltaX, @Nullable ReadableArray deltaY, @Nullable String positionX, @Nullable String positionY) {
        PointF location = mCurrentLocation;

        if (positionX != null) {
            location.x = PropHelper.fromPercentageToFloat(positionX, mWidth, 0, mScale);
        }

        if (positionY != null) {
            location.y = PropHelper.fromPercentageToFloat(positionY, mHeight, 0, mScale);
        }

        mLocationContext.add(location);
        mFontContext.add(font);
        mDeltaXContext.add(getFloatArrayListFromReadableArray(deltaX));
        mDeltaYContext.add(getFloatArrayListFromReadableArray(deltaY));
        mXContext.add(location.x);

        mCurrentLocation = clonePointF(location);
        mContextLength++;
    }

    public void popContext() {
        float x = mXContext.get(mContextLength - 1);
        mFontContext.remove(mContextLength - 1);
        mLocationContext.remove(mContextLength - 1);
        mDeltaXContext.remove(mContextLength - 1);
        mDeltaYContext.remove(mContextLength - 1);
        mXContext.remove(mContextLength - 1);

        mContextLength--;

        if (mContextLength != 0) {
            mXContext.set(mContextLength - 1, x);
            PointF lastLocation = mLocationContext.get(mContextLength - 1);
            mCurrentLocation = clonePointF(lastLocation);
            mCurrentLocation.x = lastLocation.x = x;
        }
    }

    public PointF getNextGlyphPoint(float offset, float glyphWidth) {
        float dx = getNextDelta(mDeltaXContext);
        mCurrentLocation.x += dx;

        float dy = getNextDelta(mDeltaYContext);
        mCurrentLocation.y += dy;

        for (PointF point: mLocationContext) {
            point.x += dx;
            point.y += dy;
        }

        mXContext.set(mXContext.size() - 1, mCurrentLocation.x + offset + glyphWidth);

        return new PointF(mCurrentLocation.x + offset, mCurrentLocation.y);

    }

    private float getNextDelta(ArrayList<ArrayList<Float>> deltaContext) {
        float value = 0;
        boolean valueSet = false;
        int index = mContextLength - 1;

        for (; index >= 0; index--) {
            ArrayList<Float> delta = deltaContext.get(index);

            if (delta.size() != 0) {
                if (!valueSet) {
                    value = delta.get(0);
                    valueSet = true;
                }

                delta.remove(0);
            }
        }

        return value;
    }

    public ReadableMap getGlyphFont() {
        String fontFamily = null;
        float fontSize = DEFAULT_FONT_SIZE;
        boolean fontSizeSet = false;
        String fontWeight = null;
        String fontStyle = null;

        int index = mContextLength - 1;

        for (; index >= 0; index--) {
            ReadableMap font = mFontContext.get(index);

            if (fontFamily == null && font.hasKey("fontFamily")) {
                fontFamily = font.getString("fontFamily");
            }

            if (!fontSizeSet && font.hasKey("fontSize")) {
                fontSize = (float)font.getDouble("fontSize");
                fontSizeSet = true;
            }

            if (fontWeight == null && font.hasKey("fontWeight")) {
                fontWeight = font.getString("fontWeight");
            }
            if (fontStyle == null && font.hasKey("fontStyle")) {
                fontStyle = font.getString("fontStyle");
            }

            if (fontFamily != null && fontSizeSet && fontWeight != null && fontStyle != null) {
                break;
            }
        }

        WritableMap map = Arguments.createMap();
        map.putString("fontFamily", fontFamily);
        map.putDouble("fontSize", fontSize);
        map.putString("fontWeight", fontWeight);
        map.putString("fontStyle", fontStyle);

        return map;
    }

    private ArrayList<Float> getFloatArrayListFromReadableArray(ReadableArray readableArray) {
        ArrayList<Float> arrayList = new ArrayList<>();

        if (readableArray != null) {
            for (int i = 0; i < readableArray.size(); i++) {
                arrayList.add((float)readableArray.getDouble(i));
            }
        }

        return arrayList;
    }

    private PointF clonePointF(PointF point) {
        return new PointF(point.x, point.y);
    }
}
