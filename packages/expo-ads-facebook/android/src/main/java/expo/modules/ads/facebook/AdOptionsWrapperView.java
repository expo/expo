package expo.modules.ads.facebook;

import android.content.Context;
import android.widget.LinearLayout;

import com.facebook.ads.AdOptionsView;

import java.lang.ref.WeakReference;

public class AdOptionsWrapperView extends LinearLayout {
  private int mIconSize = -1;
  private Integer mColor = null;
  private AdOptionsView.Orientation mOrientation = null;

  private WeakReference<NativeAdView> mNativeAdViewWeakReference = new WeakReference<>(null);
  private WeakReference<AdOptionsView> mAdOptionsViewWeakReference = new WeakReference<>(null);

  public AdOptionsWrapperView(Context context) {
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

  public void setIconColor(Integer color) {
    mColor = color;
    AdOptionsView adOptionsView = mAdOptionsViewWeakReference.get();
    if (adOptionsView != null && color != null) {
      adOptionsView.setIconColor(mColor);
    }
  }

  private void maybeSetUpOptionsView() {
    NativeAdView nativeAdView = mNativeAdViewWeakReference.get();

    if (mIconSize == -1 ||
        mOrientation == null ||
        nativeAdView == null) {
      return;
    }

    removeAllViews();

    AdOptionsView adOptionsView = createNewAdOptionsView(nativeAdView);
    addView(adOptionsView);

    mAdOptionsViewWeakReference = new WeakReference<>(adOptionsView);
  }

  private AdOptionsView createNewAdOptionsView(NativeAdView nativeAdView) {
    AdOptionsView adOptionsView = new AdOptionsView(
        getContext(),
        nativeAdView.getNativeAd(),
        nativeAdView,
        mOrientation,
        mIconSize
    );

    if (mColor != null) {
      adOptionsView.setIconColor(mColor);
    }

    return adOptionsView;
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
