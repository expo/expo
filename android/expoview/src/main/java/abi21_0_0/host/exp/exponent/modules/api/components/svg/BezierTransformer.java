/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */


package abi21_0_0.host.exp.exponent.modules.api.components.svg;

import android.graphics.Matrix;
import android.graphics.PointF;

import abi21_0_0.com.facebook.react.bridge.ReadableArray;
import abi21_0_0.com.facebook.react.bridge.ReadableMap;

public class BezierTransformer {
    private ReadableArray mBezierCurves;
    private int mCurrentBezierIndex = 0;
    private float mStartOffset = 0f;
    private float mLastOffset = 0f;
    private float mLastRecord = 0f;
    private float mLastDistance = 0f;
    private PointF mLastPoint = new PointF();
    private PointF mP0 = new PointF();
    private PointF mP1 = new PointF();
    private PointF mP2 = new PointF();
    private PointF mP3 = new PointF();
    private boolean mReachedStart;
    private boolean mReachedEnd;

    BezierTransformer(ReadableArray bezierCurves, float startOffset) {
        mBezierCurves = bezierCurves;
        mStartOffset = startOffset;
    }

    private float calculateBezier(float t, float P0, float P1, float P2, float P3) {
        return (1-t)*(1-t)*(1-t)*P0+3*(1-t)*(1-t)*t*P1+3*(1-t)*t*t*P2+t*t*t*P3;
    }

    private PointF pointAtOffset(float t) {
        float x = calculateBezier(t, mP0.x, mP1.x, mP2.x, mP3.x);
        float y = calculateBezier(t, mP0.y, mP1.y, mP2.y, mP3.y);
        return new PointF(x, y);
    }

    private float calculateBezierPrime(float t, float P0, float P1, float P2, float P3) {
        return -3*(1-t)*(1-t)*P0+(3*(1-t)*(1-t)*P1)-(6*t*(1-t)*P1)-(3*t*t*P2)+(6*t*(1-t)*P2)+3*t*t*P3;
    }

    private float angleAtOffset(float t) {
        float dx = calculateBezierPrime(t, mP0.x, mP1.x, mP2.x, mP3.x);
        float dy = calculateBezierPrime(t, mP0.y, mP1.y, mP2.y, mP3.y);
        return (float)Math.atan2(dy, dx);
    }

    private float calculateDistance(PointF a, PointF b) {
        return (float)Math.hypot(a.x - b.x, a.y - b.y);
    }

    private PointF getPointFromMap(ReadableMap map) {
        return new PointF((float)map.getDouble("x"), (float)map.getDouble("y"));
    }

    // Simplistic routine to find the offset along Bezier that is
    // `distance` away from `point`. `offset` is the offset used to
    // generate `point`, and saves us the trouble of recalculating it
    // This routine just walks forward until it finds a point at least
    // `distance` away. Good optimizations here would reduce the number
    // of guesses, but this is tricky since if we go too far out, the
    // curve might loop back on leading to incorrect results. Tuning
    // kStep is good start.
    private float offsetAtDistance(float distance, PointF point, float offset) {
        float kStep = 0.001f; // 0.0001 - 0.001 work well
        float newDistance = 0;
        float newOffset = offset + kStep;
        while (newDistance <= distance && newOffset < 1.0) {
            newOffset += kStep;
            newDistance = calculateDistance(point, pointAtOffset(newOffset));
        }

        mLastDistance = newDistance;
        return newOffset;
    }

    private void setControlPoints() {
        ReadableArray bezier = mBezierCurves.getArray(mCurrentBezierIndex++);

        if (bezier != null) {
            // set start point
            if (bezier.size() == 1) {
                mLastPoint = mP0 = getPointFromMap(bezier.getMap(0));
                setControlPoints();
            } else if (bezier.size() == 3) {
                mP1 = getPointFromMap(bezier.getMap(0));
                mP2 = getPointFromMap(bezier.getMap(1));
                mP3 = getPointFromMap(bezier.getMap(2));
            }
        }
    }

    public Matrix getTransformAtDistance(float distance) {
        distance += mStartOffset;
        mReachedStart = distance >= 0;

        if (mReachedEnd || !mReachedStart) {
            return new Matrix();
        }

        float offset = offsetAtDistance(distance - mLastRecord, mLastPoint, mLastOffset);

        if (offset < 1) {
            PointF glyphPoint = pointAtOffset(offset);
            mLastOffset = offset;
            mLastPoint = glyphPoint;
            mLastRecord = distance;
            Matrix matrix = new Matrix();
            matrix.setRotate((float)Math.toDegrees(angleAtOffset(offset)));
            matrix.postTranslate(glyphPoint.x, glyphPoint.y);
            return matrix;
        } else if (mBezierCurves.size() == mCurrentBezierIndex) {
            mReachedEnd = true;
            return new Matrix();
        } else {
            mLastOffset = 0;
            mLastPoint = mP0 = mP3;
            mLastRecord += mLastDistance;
            setControlPoints();
            return getTransformAtDistance(distance - mStartOffset);
        }
    }

    public boolean hasReachedEnd() {
        return mReachedEnd;
    }

    public boolean hasReachedStart() {
        return mReachedStart;
    }
}
