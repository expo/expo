package expo.modules.image.drawing;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Outline;
import android.graphics.Path;
import android.graphics.RectF;
import android.view.View;
import android.view.ViewOutlineProvider;

import com.facebook.react.modules.i18nmanager.I18nUtil;
import com.facebook.react.uimanager.FloatUtil;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.yoga.YogaConstants;

import java.util.Arrays;

public class OutlineProvider extends ViewOutlineProvider {

  private Context mContext;
  private int mLayoutDirection;
  private RectF mBounds;
  private float[] mBorderRadiusConfig;
  private float[] mCornerRadii;
  private boolean mCornerRadiiInvalidated;
  private Path mConvexPath;
  private boolean mConvexPathInvalidated;
  public OutlineProvider(Context context) {
    super();
    mContext = context;
    mLayoutDirection = View.LAYOUT_DIRECTION_LTR;
    mBounds = new RectF();
    mBorderRadiusConfig = new float[9];
    Arrays.fill(mBorderRadiusConfig, YogaConstants.UNDEFINED);
    mCornerRadii = new float[4];
    mCornerRadiiInvalidated = true;
    mConvexPath = new Path();
    mConvexPathInvalidated = true;
    updateCornerRadiiIfNeeded();
  }

  private void updateCornerRadiiIfNeeded() {
    if (mCornerRadiiInvalidated) {
      boolean isRTL = mLayoutDirection == View.LAYOUT_DIRECTION_RTL;
      boolean isRTLSwap = I18nUtil.getInstance().doLeftAndRightSwapInRTL(mContext);
      updateCornerRadius(
        CornerRadius.TOP_LEFT,
        BorderRadiusConfig.TOP_LEFT,
        BorderRadiusConfig.TOP_RIGHT,
        BorderRadiusConfig.TOP_START,
        BorderRadiusConfig.TOP_END,
        isRTL,
        isRTLSwap
      );
      updateCornerRadius(
        CornerRadius.TOP_RIGHT,
        BorderRadiusConfig.TOP_RIGHT,
        BorderRadiusConfig.TOP_LEFT,
        BorderRadiusConfig.TOP_END,
        BorderRadiusConfig.TOP_START,
        isRTL,
        isRTLSwap
      );
      updateCornerRadius(
        CornerRadius.BOTTOM_LEFT,
        BorderRadiusConfig.BOTTOM_LEFT,
        BorderRadiusConfig.BOTTOM_RIGHT,
        BorderRadiusConfig.BOTTOM_START,
        BorderRadiusConfig.BOTTOM_END,
        isRTL,
        isRTLSwap
      );
      updateCornerRadius(
        CornerRadius.BOTTOM_RIGHT,
        BorderRadiusConfig.BOTTOM_RIGHT,
        BorderRadiusConfig.BOTTOM_LEFT,
        BorderRadiusConfig.BOTTOM_END,
        BorderRadiusConfig.BOTTOM_START,
        isRTL,
        isRTLSwap
      );
      mCornerRadiiInvalidated = false;
      mConvexPathInvalidated = true;
    }
  }

  private void updateCornerRadius(CornerRadius outputPosition, BorderRadiusConfig inputPosition, BorderRadiusConfig oppositePosition, BorderRadiusConfig startPosition, BorderRadiusConfig endPosition, boolean isRTL, boolean isRTLSwap) {
    float radius = mBorderRadiusConfig[inputPosition.ordinal()];
    if (isRTL) {
      if (isRTLSwap) {
        radius = mBorderRadiusConfig[oppositePosition.ordinal()];
      }
      if (YogaConstants.isUndefined(radius)) {
        radius = mBorderRadiusConfig[endPosition.ordinal()];
      }
    } else {
      if (YogaConstants.isUndefined(radius)) {
        radius = mBorderRadiusConfig[startPosition.ordinal()];
      }
    }
    if (YogaConstants.isUndefined(radius)) {
      radius = mBorderRadiusConfig[BorderRadiusConfig.ALL.ordinal()];
    }
    if (YogaConstants.isUndefined(radius)) {
      radius = 0;
    }
    mCornerRadii[outputPosition.ordinal()] = PixelUtil.toPixelFromDIP(radius);
  }

  private void updateConvexPathIfNeeded() {
    if (mConvexPathInvalidated) {
      mConvexPath.reset();
      mConvexPath.addRoundRect(
        mBounds,
        new float[]{
          mCornerRadii[CornerRadius.TOP_LEFT.ordinal()],
          mCornerRadii[CornerRadius.TOP_LEFT.ordinal()],
          mCornerRadii[CornerRadius.TOP_RIGHT.ordinal()],
          mCornerRadii[CornerRadius.TOP_RIGHT.ordinal()],
          mCornerRadii[CornerRadius.BOTTOM_RIGHT.ordinal()],
          mCornerRadii[CornerRadius.BOTTOM_RIGHT.ordinal()],
          mCornerRadii[CornerRadius.BOTTOM_LEFT.ordinal()],
          mCornerRadii[CornerRadius.BOTTOM_LEFT.ordinal()]
        },
        Path.Direction.CW);
      mConvexPathInvalidated = false;
    }
  }

  public float[] getBorderRadii() {
    return mBorderRadiusConfig;
  }

  public boolean hasEqualCorners() {
    updateCornerRadiiIfNeeded();
    float initialCornerRadius = mCornerRadii[0];
    for (final float cornerRadius : mCornerRadii) {
      if (initialCornerRadius != cornerRadius) {
        return false;
      }
    }
    return true;
  }

  public boolean setBorderRadius(float radius, int position) {
    if (!FloatUtil.floatsEqual(mBorderRadiusConfig[position], radius)) {
      mBorderRadiusConfig[position] = radius;
      mCornerRadiiInvalidated = true;
      return true;
    }
    return false;
  }

  private void updateBoundsAndLayoutDirection(View view) {

    // Update layout direction
    int layoutDirection = view.getLayoutDirection();
    if (mLayoutDirection != layoutDirection) {
      mLayoutDirection = layoutDirection;
      mCornerRadiiInvalidated = true;
    }

    // Update size
    int left = 0;
    int top = 0;
    int right = view.getWidth();
    int bottom = view.getHeight();
    if ((mBounds.left != left) || (mBounds.top != top) || (mBounds.right != right) || (mBounds.bottom != bottom)) {
      mBounds.set(left, top, right, bottom);
      mCornerRadiiInvalidated = true;
    }
  }

  public void getOutline(View view, Outline outline) {
    updateBoundsAndLayoutDirection(view);

    // Calculate outline
    updateCornerRadiiIfNeeded();
    if (hasEqualCorners()) {
      float cornerRadius = mCornerRadii[0];
      if (cornerRadius > 0) {
        outline.setRoundRect(0, 0, (int) mBounds.width(), (int) mBounds.height(), cornerRadius);
      } else {
        outline.setRect(0, 0, (int) mBounds.width(), (int) mBounds.height());
      }
    } else {
      // Clipping is not supported when using a convex path, but drawing the elevation
      // shadow is. For the particular case, we fallback to canvas clipping in the view
      // which is supposed to call `clipCanvasIfNeeded` in its `draw` method.
      updateConvexPathIfNeeded();
      outline.setConvexPath(mConvexPath);
    }
  }

  public void clipCanvasIfNeeded(Canvas canvas, View view) {
    updateBoundsAndLayoutDirection(view);
    updateCornerRadiiIfNeeded();
    if (!hasEqualCorners()) {
      updateConvexPathIfNeeded();
      canvas.clipPath(mConvexPath);
    }
  }

  public enum BorderRadiusConfig {
    ALL,
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_RIGHT,
    BOTTOM_LEFT,
    TOP_START,
    TOP_END,
    BOTTOM_START,
    BOTTOM_END
  }

  public enum CornerRadius {
    TOP_LEFT,
    TOP_RIGHT,
    BOTTOM_RIGHT,
    BOTTOM_LEFT,
  }
}
