package abi29_0_0.host.exp.exponent.modules.api.components;

import abi29_0_0.com.facebook.react.bridge.ReadableArray;
import abi29_0_0.com.facebook.react.uimanager.PixelUtil;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.view.View;

public class LinearGradientView extends View {
    private final Paint mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private Path mPathForBorderRadius;
    private RectF mTempRectForBorderRadius;
    private LinearGradient mShader;

    private float[] mLocations;
    private float[] mStartPos = {0, 0};
    private float[] mEndPos = {0, 1};
    private int[] mColors;
    private int[] mSize = {0, 0};
    private float[] mBorderRadii = {0, 0, 0, 0, 0, 0, 0, 0};

    public LinearGradientView(Context context) {
        super(context);
    }

    public void setStartPosition(ReadableArray startPos) {
        mStartPos = new float[]{(float) startPos.getDouble(0), (float) startPos.getDouble(1)};
        drawGradient();
    }

    public void setEndPosition(ReadableArray endPos) {
        mEndPos = new float[]{(float) endPos.getDouble(0), (float) endPos.getDouble(1)};
        drawGradient();
    }

    public void setColors(ReadableArray colors) {
        int[] _colors = new int[colors.size()];
        for (int i=0; i < _colors.length; i++)
        {
            _colors[i] = colors.getInt(i);
        }
        mColors = _colors;
        drawGradient();
    }

    public void setLocations(ReadableArray locations) {
        float[] _locations = new float[locations.size()];
        for (int i=0; i < _locations.length; i++)
        {
            _locations[i] = (float) locations.getDouble(i);
        }
        mLocations = _locations;
        drawGradient();
    }

    public void setBorderRadii(ReadableArray borderRadii) {
        float[] _radii = new float[borderRadii.size()];
        for (int i=0; i < _radii.length; i++)
        {
            _radii[i] = PixelUtil.toPixelFromDIP((float) borderRadii.getDouble(i));
        }
        mBorderRadii = _radii;
        updatePath();
        drawGradient();
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        mSize = new int[]{w, h};
        updatePath();
        drawGradient();
    }

    private void drawGradient() {
        // guard against crashes happening while multiple properties are updated
        if (mColors == null || (mLocations != null && mColors.length != mLocations.length))
            return;
        mShader = new LinearGradient(
            mStartPos[0] * mSize[0],
            mStartPos[1] * mSize[1],
            mEndPos[0] * mSize[0],
            mEndPos[1] * mSize[1],
            mColors,
            mLocations,
            Shader.TileMode.MIRROR);
        mPaint.setShader(mShader);
        invalidate();
    }

    private void updatePath() {
        if (mPathForBorderRadius == null) {
            mPathForBorderRadius = new Path();
            mTempRectForBorderRadius = new RectF();
        }
        mPathForBorderRadius.reset();
        mTempRectForBorderRadius.set(0f, 0f, (float) mSize[0], (float) mSize[1]);
        mPathForBorderRadius.addRoundRect(
            mTempRectForBorderRadius,
            mBorderRadii,
            Path.Direction.CW);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        if (mPathForBorderRadius == null) {
            canvas.drawPaint(mPaint);
        } else {
            canvas.drawPath(mPathForBorderRadius, mPaint);
        }
    }
}
