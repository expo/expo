package expo.modules.ads.facebook;

import android.content.Context;
import android.graphics.Canvas;
import android.icu.util.Measure;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;

import com.facebook.ads.AdChoicesView;
import com.facebook.ads.AdOptionsView;

import java.lang.ref.WeakReference;

public class AdChoiceWrapperView extends LinearLayout {

  private int mIconSize = -1;
  private WeakReference<NativeAdView> mNativeAdViewWeakReference;

  public AdChoiceWrapperView(Context context) {
    super(context);
  }

  public void setNativeAdView(NativeAdView nativeAdView) {
    mNativeAdViewWeakReference = new WeakReference<>(nativeAdView);
    injectAdChoiceView();
  }

  public void setIconSize(int iconSize) {
    mIconSize = iconSize;
    injectAdChoiceView();
  }

  boolean arePropsSet() {
    return (
        mNativeAdViewWeakReference != null ||
        mNativeAdViewWeakReference.get() != null ||
        mIconSize != -1
    );
  }

  public void injectAdChoiceView() {
    if (!arePropsSet()) {
      return;
    }
    removeAllViews();

    NativeAdView nativeAdView = mNativeAdViewWeakReference.get();
    AdOptionsView adOptionsView = createAdOptionsViewWithProperIconSize(mIconSize, nativeAdView);

    addView(adOptionsView);
  }

  private AdOptionsView createAdOptionsViewWithProperIconSize(int iconSize, NativeAdView nativeAdView) {
    return new AdOptionsView(
        getContext(),
        nativeAdView.getNativeAd(),
        nativeAdView,
        AdOptionsView.Orientation.HORIZONTAL,
        iconSize
    );
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
