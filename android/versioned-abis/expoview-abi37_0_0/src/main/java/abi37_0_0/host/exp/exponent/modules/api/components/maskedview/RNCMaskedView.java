package abi37_0_0.host.exp.exponent.modules.api.components.maskedview;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.view.View;

import abi37_0_0.com.facebook.react.views.view.ReactViewGroup;

public class RNCMaskedView extends ReactViewGroup {
  private static final String TAG = "RNCMaskedView";

  private Bitmap mBitmapMask = null;
  private Paint mPaint;
  private PorterDuffXfermode mPorterDuffXferMode;

  public RNCMaskedView(Context context) {
    super(context);
    setLayerType(LAYER_TYPE_SOFTWARE, null);

    mPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    mPorterDuffXferMode = new PorterDuffXfermode(PorterDuff.Mode.DST_IN);
  }

  @Override
  protected void dispatchDraw(Canvas canvas) {
    super.dispatchDraw(canvas);

    // draw the mask
    if (mBitmapMask != null) {
      mPaint.setXfermode(mPorterDuffXferMode);
      canvas.drawBitmap(mBitmapMask, 0, 0, mPaint);
      mPaint.setXfermode(null);
    }
  }

  @Override
  protected void onLayout(boolean changed, int l, int t, int r, int b) {
    super.onLayout(changed, l, t, r, b);

    if (changed) {
      View maskView = getChildAt(0);
      maskView.setVisibility(View.VISIBLE);
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
}
