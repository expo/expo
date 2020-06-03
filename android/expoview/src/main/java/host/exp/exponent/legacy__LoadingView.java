// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.graphics.Color;
import android.os.Handler;
import androidx.annotation.Nullable;
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

public class legacy__LoadingView extends RelativeLayout {

  private static final String TAG = legacy__LoadingView.class.getSimpleName();

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

  public legacy__LoadingView(Context context) {
    super(context);
    init();
  }

  public legacy__LoadingView(Context context, AttributeSet attrs) {
    super(context, attrs);
    init();
  }

  public legacy__LoadingView(Context context, AttributeSet attrs, int defStyleAttr) {
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

    if (isUsingNewSplashScreenStyle(manifest)) {
      // If using new splash style, don't show the icon at all
      mImageView.setAlpha(0.0f);
    } else if (loadingInfo != null && loadingInfo.has(ExponentManifest.MANIFEST_LOADING_ICON_URL)) {
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
    } else if (loadingInfo != null && loadingInfo.has(ExponentManifest.MANIFEST_LOADING_EXPONENT_ICON_GRAYSCALE)) {
      mImageView.setImageResource(R.drawable.big_logo_dark);

      int grayscale = (int) (255 * loadingInfo.optDouble(ExponentManifest.MANIFEST_LOADING_EXPONENT_ICON_GRAYSCALE, 1.0));
      if (grayscale < 0) {
        grayscale = 0;
      } else if (grayscale > 255) {
        grayscale = 255;
      }
      mImageView.setColorFilter(Color.argb(255, grayscale, grayscale, grayscale));
    } else if (loadingInfo != null) {
      // Only look at icon color if grayscale field doesn't exist.
      String exponentLogoColor = loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_EXPONENT_ICON_COLOR, null);
      if (exponentLogoColor != null) {
        if (exponentLogoColor.equals("white")) {
          mImageView.setImageResource(R.drawable.big_logo_new_filled);
        } else if (exponentLogoColor.equals("navy") || exponentLogoColor.equals("blue")) {
          mImageView.setImageResource(R.drawable.big_logo_dark_filled);
        }
      }
    }

    setBackgroundImage(manifest);
    setBackgroundColor(manifest);
  }

  private void setBackgroundImage(final JSONObject manifest) {
    if (isUsingNewSplashScreenStyle(manifest)) {
      ImageView.ScaleType scaleType = scaleType(manifest);
      mBackgroundImageView.setScaleType(scaleType);
    }

    if (Constants.isStandaloneApp()) {
      revealView(mBackgroundImageView);
      return;
    }

    final String backgroundImageUrl = backgroundImageURL(manifest);
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

  private ImageView.ScaleType scaleType(final JSONObject manifest) {
    String resizeMode = null;
    JSONObject splash = null;

    if (manifest.has("android")) {
      final JSONObject android = manifest.optJSONObject("android");
      if (android.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
        splash = android.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);
      }
    }

    if (splash == null) {
      if (manifest.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
        splash = manifest.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);
      }
    }

    if (splash != null && splash.has(ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE)) {
      resizeMode = splash.optString(ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE, "contain");
    }

    if (resizeMode == null) {
      return ImageView.ScaleType.FIT_CENTER;
    }

    if (resizeMode.equals("cover")) {
      return ImageView.ScaleType.CENTER_CROP;
    } else {
      return ImageView.ScaleType.FIT_CENTER;
    }
  }

  private void setBackgroundColor(final JSONObject manifest) {
    String backgroundColor = null;
    if (isUsingNewSplashScreenStyle(manifest)) {
      JSONObject splash = null;

      if (manifest.has("android")) {
        final JSONObject android = manifest.optJSONObject("android");
        splash = android.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);
      }
      if (splash == null && manifest.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
        splash = manifest.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);
      }

      if (splash != null) {
        backgroundColor = splash.optString(ExponentManifest.MANIFEST_SPLASH_BACKGROUND_COLOR);
      }
    } else if (manifest.has(ExponentManifest.MANIFEST_LOADING_INFO_KEY)) {
      final JSONObject loadingInfo = manifest.optJSONObject(ExponentManifest.MANIFEST_LOADING_INFO_KEY);
      if (loadingInfo != null) {
        backgroundColor = loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_BACKGROUND_COLOR);
      }
    }

    if (backgroundColor == null || !ColorParser.isValid(backgroundColor)) {
      backgroundColor = "#FFFFFF";
    }

    this.setBackgroundColor(Color.parseColor(backgroundColor));

    mImageView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
  }

  private String backgroundImageURL(final JSONObject manifest) {
    if (isUsingNewSplashScreenStyle(manifest)) {
      JSONObject splash;

      if (manifest.has("android")) {
        final JSONObject android = manifest.optJSONObject("android");
        if (android.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
          splash = android.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);

          // Use the largest available image in the `android.splash` object, or `splash.imageUrl` if none is available .
          final String[] keys = {"xxxhdpiUrl", "xxhdpiUrl", "xhdpiUrl", "hdpiUrl", "mdpiUrl", "ldpiUrl"};

          for (String key : keys) {
            if (splash.has(key) && splash.optString(key) != null) {
              return splash.optString(key);
            }
          }
        }
      }
      if (manifest.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
        splash = manifest.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY);
        if (splash.has(ExponentManifest.MANIFEST_SPLASH_IMAGE_URL)) {
          return splash.optString(ExponentManifest.MANIFEST_SPLASH_IMAGE_URL);
        }
      }
    } else {
      if (manifest.has(ExponentManifest.MANIFEST_LOADING_INFO_KEY)) {
        final JSONObject loadingInfo = manifest.optJSONObject(ExponentManifest.MANIFEST_LOADING_INFO_KEY);
        if (loadingInfo != null) {
          return loadingInfo.optString(ExponentManifest.MANIFEST_LOADING_BACKGROUND_IMAGE_URL, null);
        }
      }
    }

    return null;
  }

  private Boolean isUsingNewSplashScreenStyle(final JSONObject manifest) {
    if (manifest.has(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)) {
      if (manifest.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY) != null) {
        return true;
      }
    }

    if (manifest.has("android")) {
      final JSONObject android = manifest.optJSONObject("android");
      return android.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY) != null;
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
