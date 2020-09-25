// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.IntentService;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import androidx.core.content.ContextCompat;

import org.json.JSONObject;

import javax.inject.Inject;

import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.di.NativeModuleDepsProvider;
import host.exp.exponent.experience.ExperienceActivity;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.kernel.Kernel;
import host.exp.expoview.R;

import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;

public class ExponentIntentService extends IntentService {

  private static final String ACTION_RELOAD_EXPERIENCE = "host.exp.exponent.action.RELOAD_EXPERIENCE";
  private static final String ACTION_STAY_AWAKE = "host.exp.exponent.action.STAY_AWAKE";

  private static final long STAY_AWAKE_MS = 1000 * 60;

  @Inject
  Kernel mKernel;

  private Handler mHandler = new Handler();

  public static Intent getActionReloadExperience(Context context, String manifestUrl) {
    Intent intent = new Intent(context, ExponentIntentService.class);
    intent.setAction(ACTION_RELOAD_EXPERIENCE);
    intent.putExtra(MANIFEST_URL_KEY, manifestUrl);
    return intent;
  }

  public static Intent getActionStayAwake(Context context) {
    Intent intent = new Intent(context, ExponentIntentService.class);
    intent.setAction(ACTION_STAY_AWAKE);
    return intent;
  }

  public ExponentIntentService() {
    super("ExponentIntentService");
  }

  @Override
  public void onCreate() {
    super.onCreate();
    NativeModuleDepsProvider.getInstance().inject(ExponentIntentService.class, this);
  }

  @Override
  protected void onHandleIntent(Intent intent) {
    if (intent != null) {
      String action = intent.getAction();
      boolean isUserAction = false;
      switch (action) {
        case ACTION_RELOAD_EXPERIENCE:
          isUserAction = true;
          handleActionReloadExperience(intent.getStringExtra(MANIFEST_URL_KEY));
          break;
        case ACTION_STAY_AWAKE:
          handleActionStayAwake();
          break;
      }

      if (isUserAction) {
        Activity kernelActivityContext = mKernel.getActivityContext();
        if (kernelActivityContext instanceof ExperienceActivity) {
          ExperienceActivity currentExperienceActivity = (ExperienceActivity) kernelActivityContext;
          currentExperienceActivity.onNotificationAction();
        }
      }
    }
  }

  private void handleActionReloadExperience(String manifestUrl) {
    mKernel.reloadVisibleExperience(manifestUrl);

    Intent intent = new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
    sendBroadcast(intent);
    Analytics.logEventWithManifestUrl(Analytics.RELOAD_EXPERIENCE, manifestUrl);

    stopSelf();
  }

  private void handleActionStayAwake() {
    mHandler.postDelayed(new Runnable() {
      @Override
      public void run() {
        stopSelf();
      }
    }, STAY_AWAKE_MS);
  }
}
