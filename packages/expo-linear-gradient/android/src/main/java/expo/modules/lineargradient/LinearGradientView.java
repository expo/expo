package expo.modules.lineargradient;

import java.util.ArrayList;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.util.TypedValue;
import android.view.View;

public class LinearGradientView extends View {
  private final Paint mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
  private Path mPathForBorderRadius;
  private RectF mTempRectForBorderRadius;

  private float[] mLocations;
  private float[] mStartPos = {0, 0};
  private float[] mEndPos = {0, 1};
  private int[] mColors;
  private int[] mSize = {0, 0};
  private float[] mBorderRadii = {0, 0, 0, 0, 0, 0, 0, 0};

  public LinearGradientView(Context context) {
    super(context);
  }

  public void setStartPosition(final ArrayList<Double> startPos) {
    mStartPos = new float[]{startPos.get(0).floatValue(), startPos.get(1).floatValue()};
    drawGradient();
  }

  public void setEndPosition(final ArrayList<Double> endPos) {
    mEndPos = new float[]{endPos.get(0).floatValue(), endPos.get(1).floatValue()};
    drawGradient();
  }

  public void setColors(final ArrayList<Double> colors) {
    int[] _colors = new int[colors.size()];
    for (int i=0; i < _colors.length; i++)
    {
      _colors[i] = colors.get(i).intValue();
    }
    mColors = _colors;
    drawGradient();
  }

  public void setLocations(final ArrayList<Double> locations) {
    float[] _locations = new float[locations.size()];
    for (int i=0; i < _locations.length; i++)
    {
      _locations[i] = locations.get(i).floatValue();
    }
    mLocations = _locations;
    drawGradient();
  }

  public void setBorderRadii(final ArrayList<Double> borderRadii) {
    float[] _radii = new float[borderRadii.size()];
    for (int i=0; i < _radii.length; i++)
    {
       _radii[i] = toPixelFromDIP(borderRadii.get(i).floatValue());
    }
    mBorderRadii = _radii;
    updatePath();
    drawGradient();
  }

  // Copied from RN PixelUtil
  // We might want to expose display metrics on @unimodules/core somewhere to avoid
  // having code similar to this littered throughout modules
  private float toPixelFromDIP(float value) {
    return TypedValue.applyDimension(
        TypedValue.COMPLEX_UNIT_DIP,
        value,
        getContext().getResources().getDisplayMetrics()
    );
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
    LinearGradient mShader = new LinearGradient(
        mStartPos[0] * mSize[0],
        mStartPos[1] * mSize[1],
        mEndPos[0] * mSize[0],
        mEndPos[1] * mSize[1],
        mColors,
        mLocations,
        Shader.TileMode.CLAMP);
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
