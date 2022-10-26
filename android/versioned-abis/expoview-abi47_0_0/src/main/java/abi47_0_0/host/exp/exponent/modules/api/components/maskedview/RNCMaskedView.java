package abi47_0_0.host.exp.exponent.modules.api.components.maskedview;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.view.View;

import abi47_0_0.com.facebook.react.views.view.ReactViewGroup;

public class RNCMaskedView extends ReactViewGroup {
  private static final String TAG = "RNCMaskedView";

  private Bitmap mBitmapMask = null;
  private boolean mBitmapMaskInvalidated = false;
  private Paint mPaint;
  private PorterDuffXfermode mPorterDuffXferMode;

  public RNCMaskedView(Context context) {
    super(context);

    // Default to hardware rendering, androidRenderingMode prop will override
    setRenderingMode("hardware");

    mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    mPorterDuffXferMode = new PorterDuffXfermode(PorterDuff.Mode.DST_IN);
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    super.dispatchDraw(canvas);

    if (mBitmapMaskInvalidated) {
      // redraw mask element to support animated elements
      updateBitmapMask();

      mBitmapMaskInvalidated = false;
    }

    // draw the mask
    if (mBitmapMask != null) {
      mPaint.setXfermode(mPorterDuffXferMode);
      canvas.drawBitmap(mBitmapMask, 0, 0, mPaint);
      mPaint.setXfermode(null);
    }
  }

  @Override
  public void onDescendantInvalidated(View child, View target) {
    super.onDescendantInvalidated(child, target);

    if (!mBitmapMaskInvalidated) {
      View maskView = getChildAt(0);
      if (maskView != null) {
        if (maskView.equals(child)) {
          mBitmapMaskInvalidated = true;
        }
      }
    }
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    super.onLayout(changed, l, t, r, b);

    if (changed) {
      mBitmapMaskInvalidated = true;
    }
  }

  @Override
  protected void onAttachedToWindow() {
    super.onAttachedToWindow();
    mBitmapMaskInvalidated = true;
  }

  private void updateBitmapMask() {
    View maskView = getChildAt(0);
    if (maskView != null) {
      maskView.setVisibility(View.VISIBLE);
      if (this.mBitmapMask != null) {
        this.mBitmapMask.recycle();
      }
      this.mBitmapMask = getBitmapFromView(maskView);
      maskView.setVisibility(View.INVISIBLE);
    }
  }

  public static Bitmap getBitmapFromView(final View view) {
    view.layout(0, 0, view.getMeasuredWidth(), view.getMeasuredHeight());

    if (view.getMeasuredWidth() <= 0 || view.getMeasuredHeight() <= 0) {
      return null;
    }

    final Bitmap bitmap = Bitmap.createBitmap(view.getMeasuredWidth(),
            view.getMeasuredHeight(), Bitmap.Config.ARGB_8888);

    final Canvas canvas = new Canvas(bitmap);

    view.draw(canvas);

    return bitmap;
  }

  public void setRenderingMode(String renderingMode) {
    if (renderingMode.equals("software")) {
      setLayerType(LAYER_TYPE_SOFTWARE, null);
    } else {
      setLayerType(LAYER_TYPE_HARDWARE, null);
    }
  }
}
