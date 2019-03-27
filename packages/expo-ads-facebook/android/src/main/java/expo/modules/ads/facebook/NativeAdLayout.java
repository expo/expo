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

    // The spinner relies on a measure + layout pass happening after it calls requestLayout().
    // Without this, the widget never actually changes the selection and doesn't call the
    // appropriate listeners. Since we override onLayout in our ViewGroups, a layout pass never
    // happens after a call to requestLayout, so we simulate one here.
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
