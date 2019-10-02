package expo.modules.ads.facebook;

import android.content.Context;

/**
 * When a user taps on {@link com.facebook.ads.AdOptionsView},
 * it triggers change in {@link NativeAdLayout} -- some views are added
 * to the layout. Since {@link NativeAdLayout} would have several direct children
 * from the developer, they would get mislayouted. Using {@link NativeAdLayout}
 * as a standalone wrapper view fixes this problem.
 */
public class NativeAdLayout extends com.facebook.ads.NativeAdLayout {

  public NativeAdLayout(Context context) {
    super(context);
  }

  @Override
  public void requestLayout() {
    super.requestLayout();
    // We need to override requestLayout because RN is blocking it.
    // Without this method we can't add child dynamically.
    post(measureAndLayout);
  }

  private final Runnable measureAndLayout = new Runnable() {
    @Override
    public void run() {
      measure(
          MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };
}
