// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.animation.ArgbEvaluator;
import android.animation.ObjectAnimator;
import android.content.Context;
import android.graphics.Color;
import android.os.Handler;
import android.support.annotation.Nullable;
import android.util.AttributeSet;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.squareup.picasso.Callback;
import com.squareup.picasso.Picasso;

import org.json.JSONObject;

import java.util.Locale;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.AsyncCondition;
import host.exp.exponent.utils.ColorParser;
import host.exp.expoview.R;

public class LoadingView extends RelativeLayout {

  private static final String TAG = LoadingView.class.getSimpleName();

  private static final String ASYNC_CONDITION_KEY = "loadingViewImage";
  private static final long PROGRESS_BAR_DELAY_MS = 2500;

  ProgressBar mProgressBar;
  ImageView mImageView;
  ImageView mBackgroundImageView;
  View mStatusBarView;
  TextView mStatusTextView;
  TextView mPercentageTextView;

  private Handler mProgressBarHandler = new Handler();
  private boolean mShowIcon = false;
  private boolean mIsLoading = false;
  private boolean mIsLoadingImageView = false;

  public LoadingView(Context context) {
    super(context);
    init();
  }

  public LoadingView(Context context, AttributeSet attrs) {
    super(context, attrs);
    init();
  }

  public LoadingView(Context context, AttributeSet attrs, int defStyleAttr) {
    super(context, attrs, defStyleAttr);
    init();
  }

  private void init() {
    inflate(getContext(), R.layout.loading_view, this);
    mProgressBar = (ProgressBar) findViewById(R.id.progress_bar);
    mImageView = (ImageView) findViewById(R.id.image_view);
    mBackgroundImageView = (ImageView) findViewById(R.id.background_image_view);
    mStatusBarView = findViewById(R.id.status_bar);
    mStatusTextView = (TextView) findViewById(R.id.status_text_view);
    mPercentageTextView = (TextView) findViewById(R.id.percentage_text_view);
    setBackgroundColor(Color.WHITE);
    showProgressBar();
  }

  private void showProgressBar() {
    mProgressBarHandler.postDelayed(new Runnable() {
      @Override
      public void run() {
        mProgressBar.setVisibility(View.VISIBLE);
        AlphaAnimation animation = new AlphaAnimation(0.0f, 1.0f);
        animation.setDuration(250);
        animation.setInterpolator(new AccelerateDecelerateInterpolator());
        animation.setFillAfter(true);
        mProgressBar.startAnimation(animation);
      }
    }, PROGRESS_BAR_DELAY_MS);
  }

  private void hideProgressBar() {
    mProgressBarHandler.removeCallbacksAndMessages(null);
    mProgressBar.clearAnimation();

    if (mProgressBar.getVisibility() == View.VISIBLE) {
      AlphaAnimation animation = new AlphaAnimation(1.0f, 0.0f);
      animation.setDuration(250);
      animation.setInterpolator(new AccelerateDecelerateInterpolator());
      animation.setFillAfter(true);
      animation.setAnimationListener(new Animation.AnimationListener() {
        @Override
        public void onAnimationStart(Animation animation) {
        }

        @Override
        public void onAnimationEnd(Animation animation) {
          mProgressBar.setVisibility(View.GONE);
        }

        @Override
        public void onAnimationRepeat(Animation animation) {

        }
      });
      mProgressBar.startAnimation(animation);
    }
  }

  public void setManifest(JSONObject manifest) {
    hideProgressBar();

    if (mIsLoading) {
      return;
    }
    mIsLoading = true;
    mIsLoadingImageView = false;

    if (manifest == null) {
      return;
    }

    JSONObject loadingInfo = manifest.optJSONObject(ExponentManifest.MANIFEST_LOADING_INFO_KEY);
    if (loadingInfo == null) {
      return;
    }

    if (this.isUsingNewSplashScreenStyle(loadingInfo)) {
      // If using new splash style, don't show the icon at all
      mImageView.setAlpha(0.0f);
    } else if (loadingInfo.has(ExponentManifest.MANIFEST_LOADING_ICON_URL)) {
      mImageView.setVisibility(View.GONE);
      final String iconUrl = loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_ICON_URL);
      mIsLoadingImageView = true;
      Picasso.with(getContext()).load(iconUrl).into(mImageView, new Callback() {
        @Override
        public void onSuccess() {
          revealView(mImageView);
          mIsLoadingImageView = false;
          AsyncCondition.notify(ASYNC_CONDITION_KEY);
        }

        @Override
        public void onError() {
          EXL.e(TAG, "Couldn't load image at url " + iconUrl);
        }
      });
    } else if (loadingInfo.has(ExponentManifest.MANIFEST_LOADING_EXPONENT_ICON_GRAYSCALE)) {
      mImageView.setImageResource(R.drawable.big_logo_dark);

      int grayscale = (int) (255 * loadingInfo.optDouble(ExponentManifest.MANIFEST_LOADING_EXPONENT_ICON_GRAYSCALE, 1.0));
      if (grayscale < 0) {
        grayscale = 0;
      } else if (grayscale > 255) {
        grayscale = 255;
      }
      mImageView.setColorFilter(Color.argb(255, grayscale, grayscale, grayscale));
    } else {
      // Only look at icon color if grayscale field doesn't exist.
      String exponentLogoColor = loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_EXPONENT_ICON_COLOR, null);
      if (exponentLogoColor != null) {
        if (exponentLogoColor.equals("white")) {
          mImageView.setImageResource(R.drawable.big_logo_filled);
        } else if (exponentLogoColor.equals("navy") || exponentLogoColor.equals("blue")) {
          mImageView.setImageResource(R.drawable.big_logo_dark_filled);
        }
      }
    }

    this.setBackgroundImage(loadingInfo);
    this.setBackgroundColor(loadingInfo);
  }

  private void setBackgroundImage(final JSONObject loadingInfo) {
    if (Constants.isShellApp() && this.isUsingNewSplashScreenStyle(loadingInfo)) {
      // The src is already set to "@drawable/shell_launch_background_image" in `loading_view.xml`
      revealView(mBackgroundImageView);
      return;
    }

    final String backgroundImageUrl = this.backgroundImageURL(loadingInfo);
    if (backgroundImageUrl != null) {
      Picasso.with(getContext()).load(backgroundImageUrl).into(mBackgroundImageView, new Callback() {
        @Override
        public void onSuccess() {
          revealView(mBackgroundImageView);
        }

        @Override
        public void onError() {
          EXL.e(TAG, "Couldn't load image at url " + backgroundImageUrl);
        }
      });
    }
  }

  private void setBackgroundColor(final JSONObject loadingInfo) {
    String backgroundColor = null;
    if (this.isUsingNewSplashScreenStyle(loadingInfo)) {
      // Get the background color from `loading.splash.backgroundColor` if this fails, fall back to old way
      if (loadingInfo.has("splash")) {
        final JSONObject splash = loadingInfo.optJSONObject("splash");
        if (splash != null && splash.has("backgroundColor")) {
          final String backgroundColorSplash = splash.optString("backgroundColor", null);
          if (backgroundColor != null) {
              backgroundColor = backgroundColorSplash;
          }
        }
      }
    }

    if (backgroundColor != null) {
      backgroundColor = loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_BACKGROUND_COLOR, null);
    }

    if (backgroundColor != null && ColorParser.isValid(backgroundColor)) {
      ObjectAnimator colorFade = ObjectAnimator.ofObject(this, "backgroundColor", new ArgbEvaluator(), Color.argb(255, 255, 255, 255), Color.parseColor(backgroundColor));
      colorFade.setDuration(300);
      colorFade.start();
    }

    mImageView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
  }

  private String backgroundImageURL(final JSONObject loadingInfo) {

    if (loadingInfo.has("splash")) {
      final JSONObject splash = loadingInfo.optJSONObject("splash");
      if (splash != null && splash.has("image")) {
        final JSONObject image = splash.optJSONObject("image");
        if (image != null && image.has("android")) {
          final JSONObject android = image.optJSONObject("android");
          if (android != null && android.has("backgroundImageUrl")) {
            final String backgroundImageURL = android.optString("backgroundImageUrl");
            // If we have the new splash.image.android.backgroundImageUrl, return it. Otherwise default to old splash image scheme.
            if (backgroundImageURL != null) {
              return backgroundImageURL;
            }
          }
        }
      }
    }

    // For non new splash style, return the "loading.backgroundImageURL" value
    return loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_BACKGROUND_IMAGE_URL, null);
  }

  private Boolean isUsingNewSplashScreenStyle(final JSONObject loadingInfo) {
    if (loadingInfo.has("splash")) {
      final JSONObject splash = loadingInfo.optJSONObject("splash");
      return splash != null;
    }
    return false;
  }

  public void setShowIcon(final boolean showIcon) {
    AsyncCondition.remove(ASYNC_CONDITION_KEY);
    AsyncCondition.wait(ASYNC_CONDITION_KEY, new AsyncCondition.AsyncConditionListener() {
      @Override
      public boolean isReady() {
        return !mIsLoadingImageView;
      }

      @Override
      public void execute() {
        boolean oldShowIcon = mShowIcon;
        mShowIcon = showIcon;

        if (mShowIcon) {
          // Don't interrupt animation if it's already happening
          if (!oldShowIcon) {
            showIcon();
          }
        } else {
          hideIcon();
        }
      }
    });
  }

  public void updateProgress(@Nullable String status, @Nullable Integer done, @Nullable Integer total) {
    mStatusBarView.setVisibility(VISIBLE);
    mStatusTextView.setText(status != null ? status : "Building JavaScript bundle...");
    if (done != null && total != null && total > 0) {
      float percent = ((float)done / (float)total * 100.f);
      mPercentageTextView.setText(String.format(Locale.getDefault(), "%.2f%%", percent));
    }
  }

  private void showIcon() {
    if (!mShowIcon || !mIsLoading) {
      return;
    }

    mImageView.clearAnimation();
    mImageView.setVisibility(View.VISIBLE);

    AlphaAnimation animation = new AlphaAnimation(0.0f, 1.0f);
    animation.setDuration(300);
    animation.setInterpolator(new AccelerateDecelerateInterpolator());
    animation.setFillAfter(true);
    mImageView.startAnimation(animation);
  }

  private void hideIcon() {
    mImageView.clearAnimation();

    AlphaAnimation animation = new AlphaAnimation(1.0f, 0.0f);
    animation.setDuration(300);
    animation.setInterpolator(new AccelerateDecelerateInterpolator());
    animation.setFillAfter(true);
    animation.setAnimationListener(new Animation.AnimationListener() {
      @Override
      public void onAnimationStart(Animation animation) {

      }

      @Override
      public void onAnimationEnd(Animation animation) {
        mImageView.setVisibility(GONE);
      }

      @Override
      public void onAnimationRepeat(Animation animation) {

      }
    });
    mImageView.startAnimation(animation);
  }

  public void setDoneLoading() {
    mIsLoading = false;
    AsyncCondition.remove(ASYNC_CONDITION_KEY);
  }

  private void revealView(View view) {
    view.setVisibility(View.VISIBLE);
    AlphaAnimation animation = new AlphaAnimation(0.0f, 1.0f);
    animation.setDuration(300);
    animation.setInterpolator(new AccelerateDecelerateInterpolator());
    animation.setFillAfter(true);
    view.setAnimation(animation);
  }
}
