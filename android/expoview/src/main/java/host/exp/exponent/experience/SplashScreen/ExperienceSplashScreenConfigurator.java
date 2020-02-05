package host.exp.exponent.experience.SplashScreen;

import android.content.Context;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AlphaAnimation;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;

import com.squareup.picasso.Callback;
import com.squareup.picasso.Picasso;

import androidx.annotation.NonNull;
import expo.modules.splashscreen.SplashScreenView;
import host.exp.exponent.analytics.EXL;
import expo.modules.splashscreen.SplashScreenMode;
import expo.modules.splashscreen.SplashScreenConfigurator;
import host.exp.expoview.R;

class ExperienceSplashScreenConfigurator implements SplashScreenConfigurator {
  private static final String TAG = ExperienceSplashScreenConfigurator.class.getSimpleName();

  private final ExperienceSplashScreenConfig mSplashScreenConfig;
  private final Boolean mShowDefaultIcon;

  ExperienceSplashScreenConfigurator(@NonNull ExperienceSplashScreenConfig splashScreenConfig, Boolean showDefaultIcon) {
    mSplashScreenConfig = splashScreenConfig;
    mShowDefaultIcon = showDefaultIcon;
  }

  @Override
  public int getBackgroundColor(@NonNull Context context) {
    return mSplashScreenConfig.getBackgroundColor();
  }

  @Override
  public void configureImageView(@NonNull Context context, @NonNull ImageView imageView, @NonNull SplashScreenMode mode) {
    if (mSplashScreenConfig.getImageUrl() != null) {
      imageView.setVisibility(View.GONE);
      Picasso.with(context).load(mSplashScreenConfig.getImageUrl()).into(imageView, new Callback() {
        @Override
        public void onSuccess() {
          imageView.setVisibility(View.VISIBLE);
          AlphaAnimation animation = new AlphaAnimation(0.0f, 1.0f);
          animation.setDuration(300);
          animation.setInterpolator(new AccelerateDecelerateInterpolator());
          animation.setFillAfter(true);
          imageView.setAnimation(animation);
        }

        @Override
        public void onError() {
          EXL.e(TAG, "Couldn't load image at url " + mSplashScreenConfig.getImageUrl());
        }
      });
    } else if (mShowDefaultIcon) {
      RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
      layoutParams.addRule(RelativeLayout.CENTER_HORIZONTAL, RelativeLayout.TRUE);
      layoutParams.addRule(RelativeLayout.CENTER_VERTICAL, RelativeLayout.TRUE);
      imageView.setLayoutParams(layoutParams);
      imageView.setAdjustViewBounds(true);
      imageView.setMaxWidth(convertDpToPixel(context, 200));
      imageView.setMaxHeight(convertDpToPixel(context, 200));
      imageView.setScaleType(ImageView.ScaleType.FIT_CENTER);
      imageView.setImageResource(R.drawable.big_logo_new_filled);
    }
  }

  @Override
  public void configureSplashScreen(@NonNull Context context, @NonNull SplashScreenView splashScreenView) {
    if (mSplashScreenConfig.getImageUrl() == null && !mShowDefaultIcon) {
      // show progress view
      splashScreenView.getImageView().setVisibility(View.GONE);

      ProgressBar progressBar = new ProgressBar(context, null, android.R.attr.progressBarStyleLarge);
      RelativeLayout.LayoutParams layoutParams = new RelativeLayout.LayoutParams(RelativeLayout.LayoutParams.WRAP_CONTENT, RelativeLayout.LayoutParams.WRAP_CONTENT);
      layoutParams.addRule(RelativeLayout.CENTER_HORIZONTAL, RelativeLayout.TRUE);
      layoutParams.addRule(RelativeLayout.CENTER_VERTICAL, RelativeLayout.TRUE);
      progressBar.setLayoutParams(layoutParams);
      AlphaAnimation animation = new AlphaAnimation(0.0f, 1.0f);
      animation.setDuration(250);
      animation.setInterpolator(new AccelerateDecelerateInterpolator());
      animation.setFillAfter(true);
      progressBar.startAnimation(animation);
      splashScreenView.addView(progressBar);
    }
  }

  private static int convertDpToPixel(Context context, int dp){
    return (int) (dp * ((float) context.getResources().getDisplayMetrics().densityDpi / DisplayMetrics.DENSITY_DEFAULT));
  }
}
