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

  public AdChoiceWrapperView(Context context) {
    super(context);
  }

  public void setNativeAdView(NativeAdView nativeAdView) {
    injectAdChoiceView(nativeAdView);
  }

  public void injectAdChoiceView(NativeAdView nativeAdView) {
    removeAllViews();
    AdChoicesView adChoicesView = new AdChoicesView(getContext(), nativeAdView.getNativeAd(), true);
    addView(adChoicesView);
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
