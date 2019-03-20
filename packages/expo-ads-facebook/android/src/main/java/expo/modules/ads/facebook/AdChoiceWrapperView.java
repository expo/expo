package expo.modules.ads.facebook;

import android.content.Context;
import android.widget.LinearLayout;

import com.facebook.ads.AdOptionsView;

import java.lang.ref.WeakReference;

public class AdChoiceWrapperView extends LinearLayout {
  private int mIconSize = -1;
  private AdOptionsView.Orientation mOrientation = null;

  private WeakReference<NativeAdView> mNativeAdViewWeakReference;

  public AdChoiceWrapperView(Context context) {
    super(context);
  }

  public void setNativeAdView(NativeAdView nativeAdView) {
    mNativeAdViewWeakReference = new WeakReference<>(nativeAdView);
    maybeSetUpOptionsView();
  }

  public void setIconSize(int iconSize) {
    mIconSize = iconSize;
    maybeSetUpOptionsView();
  }

  public void setOrientation(AdOptionsView.Orientation orientation) {
    mOrientation = orientation;
    maybeSetUpOptionsView();
  }

  private void maybeSetUpOptionsView() {
    if (mIconSize == -1 ||
        mOrientation == null ||
        mNativeAdViewWeakReference == null ||
        mNativeAdViewWeakReference.get() == null) {
      return;
    }

    removeAllViews();

    NativeAdView nativeAdView = mNativeAdViewWeakReference.get();
    AdOptionsView adOptionsView = new AdOptionsView(
        getContext(),
        nativeAdView.getNativeAd(),
        nativeAdView,
        mOrientation,
        mIconSize
    );

    addView(adOptionsView);
  }

  @Override
  public void requestLayout() {
    super.requestLayout();

    // Relayout child
    post(mMeasureAndLayout);
  }

  private final Runnable mMeasureAndLayout = new Runnable() {
    @Override
    public void run() {
      measure(
          MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
          MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
      layout(getLeft(), getTop(), getRight(), getBottom());
    }
  };
}
