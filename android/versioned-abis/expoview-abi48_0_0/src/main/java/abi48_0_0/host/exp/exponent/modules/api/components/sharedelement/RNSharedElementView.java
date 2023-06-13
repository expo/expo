package abi48_0_0.host.exp.exponent.modules.api.components.sharedelement;

// import android.util.Log;
import android.view.View;
import android.graphics.Rect;
import android.graphics.RectF;

import abi48_0_0.com.facebook.react.uimanager.ThemedReactContext;

class RNSharedElementView extends View {
  // static private final String LOG_TAG = "RNSharedElementView";

  private final RNSharedElementDrawable mDrawable;
  private RNSharedElementDrawable.ViewType mViewType;

  RNSharedElementView(ThemedReactContext context) {
    super(context);
    mViewType = RNSharedElementDrawable.ViewType.NONE;
    mDrawable = new RNSharedElementDrawable();
    setBackground(mDrawable);
  }

  @Override
  public boolean hasOverlappingRendering() {
    return mViewType == RNSharedElementDrawable.ViewType.GENERIC;
  }

  void reset() {
    setAlpha(0.0f);
  }

  void updateViewAndDrawable(
          RectF layout,
          RectF parentLayout,
          RectF originalLayout,
          Rect originalFrame,
          RNSharedElementContent content,
          RNSharedElementStyle style,
          float alpha,
          RNSharedElementResize resize,
          RNSharedElementAlign align,
          float position) {

    // Update drawable
    RNSharedElementDrawable.ViewType viewType = mDrawable.update(content, style, position);
    boolean useGPUScaling = (resize != RNSharedElementResize.CLIP) &&
            ((viewType == RNSharedElementDrawable.ViewType.GENERIC) ||
                    (viewType == RNSharedElementDrawable.ViewType.PLAIN));

    // Update layer type
    if (mViewType != viewType) {
      mViewType = viewType;
      setLayerType(useGPUScaling ? View.LAYER_TYPE_HARDWARE : View.LAYER_TYPE_NONE, null);
    }

    // Update view size/position/scale
    float width = layout.width();
    float height = layout.height();
    if (useGPUScaling) {
      int originalWidth = originalFrame.width();
      int originalHeight = originalFrame.height();

      // Update view
      layout(0, 0, originalWidth, originalHeight);
      setTranslationX(layout.left - parentLayout.left);
      setTranslationY(layout.top - parentLayout.top);

      // Update scale
      float scaleX = width / (float) originalWidth;
      float scaleY = height / (float) originalHeight;
      if (!Float.isInfinite(scaleX) && !Float.isNaN(scaleX) && !Float.isInfinite(scaleY) && !Float.isNaN(scaleY)) {

        // Determine si
        switch (resize) {
          case AUTO:
          case STRETCH:
            break;
          case CLIP:
          case NONE:
            scaleX = (float) originalWidth / originalLayout.width();
            scaleY = (float) originalHeight / originalLayout.height();
            break;
        }


                /*switch (align) {
                    case LEFT_TOP:
                        break;
                    case LEFT_CENTER:
                        break;
                    case LEFT_BOTTOM:
                        break;
                    case RIGHT_TOP:
                        break;
                    case RIGHT_CENTER:
                        break;
                    case RIGHT_BOTTOM:
                        break;
                    case CENTER_TOP:
                        break;
                    case CENTER_CENTER:
                        break;
                    case CENTER_BOTTOM:
                        break;
                }*/

        setScaleX(scaleX);
        setScaleY(scaleY);
      }
      setPivotX(0);
      setPivotY(0);
    } else {

      // Update view
      layout(0, 0, (int) Math.ceil(width), (int) Math.ceil(height));
      setTranslationX(layout.left - parentLayout.left);
      setTranslationY(layout.top - parentLayout.top);
    }

    // Update view opacity and elevation
    setAlpha(alpha);
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
      setElevation(style.elevation);
    }
  }
}
