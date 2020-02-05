package host.exp.exponent.experience.SplashScreen;

import android.app.Activity;
import android.content.Context;
import android.os.Handler;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.LinearLayout;
import android.widget.PopupWindow;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;

import java.util.Locale;

import host.exp.expoview.Exponent;
import host.exp.expoview.R;

class ExperienceLoadingView extends LinearLayout {
  private PopupWindow mLoadingPopup;
  private TextView mStatusTextView;
  private TextView mPercentageTextView;

  ExperienceLoadingView(Context context) {
    super(context);
    LayoutInflater inflater = LayoutInflater.from(context);
    inflater.inflate(R.layout.loading_view, this);
    mStatusTextView = findViewById(R.id.status_text_view);
    mPercentageTextView = findViewById(R.id.percentage_text_view);

    mLoadingPopup = new PopupWindow(this, ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
    mLoadingPopup.setTouchable(false);
  }

  public void show(Activity activity) {
    if (mLoadingPopup.isShowing()) {
      return;
    }

    Exponent.getInstance().runOnUiThread(() -> mLoadingPopup.showAtLocation(activity.getWindow().getDecorView(), Gravity.BOTTOM, 0, 0));
  }

  public void hide() {
    if (!mLoadingPopup.isShowing()) {
      return;
    }
    Exponent.getInstance().runOnUiThread(() -> mLoadingPopup.dismiss());
  }

  public void updateProgress(String status, Integer done, Integer total) {
    Exponent.getInstance().runOnUiThread(() -> {
      setVisibility(View.VISIBLE);
      mStatusTextView.setText(status != null ? status : "Building JavaScript bundle...");
      if (done != null && total != null && total > 0) {
        float percent = ((float)done / (float)total * 100.f);
        mPercentageTextView.setText(String.format(Locale.getDefault(), "%.2f%%", percent));
      }
    });
  }
}
