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
import host.exp.exponent.experience.BaseExperienceActivity;
import host.exp.exponent.experience.ExperienceActivity;
import host.exp.exponent.experience.InfoActivity;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.kernel.Kernel;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;

import static host.exp.exponent.kernel.KernelConstants.MANIFEST_URL_KEY;

public class ExponentIntentService extends IntentService {

  private static final String ACTION_INFO_SCREEN = "host.exp.exponent.action.INFO_SCREEN";
  private static final String ACTION_RELOAD_EXPERIENCE = "host.exp.exponent.action.RELOAD_EXPERIENCE";
  private static final String ACTION_SAVE_EXPERIENCE = "host.exp.exponent.action.SAVE_EXPERIENCE";
  private static final String ACTION_STAY_AWAKE = "host.exp.exponent.action.STAY_AWAKE";

  private static final long STAY_AWAKE_MS = 1000 * 60;

  @Inject
  Kernel mKernel;

  @Inject
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  ExponentManifest mExponentManifest;

  private Handler mHandler = new Handler();

  public static Intent getActionInfoScreen(Context context, String manifestUrl) {
    Intent intent = new Intent(context, ExponentIntentService.class);
    intent.setAction(ACTION_INFO_SCREEN);
    intent.putExtra(MANIFEST_URL_KEY, manifestUrl);
    return intent;
  }

  public static Intent getActionReloadExperience(Context context, String manifestUrl) {
    Intent intent = new Intent(context, ExponentIntentService.class);
    intent.setAction(ACTION_RELOAD_EXPERIENCE);
    intent.putExtra(MANIFEST_URL_KEY, manifestUrl);
    return intent;
  }

  public static Intent getActionSaveExperience(Context context, String manifestUrl) {
    Intent intent = new Intent(context, ExponentIntentService.class);
    intent.setAction(ACTION_SAVE_EXPERIENCE);
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
        case ACTION_INFO_SCREEN:
          isUserAction = true;
          handleActionInfoScreen(intent.getStringExtra(MANIFEST_URL_KEY));
          break;
        case ACTION_RELOAD_EXPERIENCE:
          isUserAction = true;
          handleActionReloadExperience(intent.getStringExtra(MANIFEST_URL_KEY));
          break;
        case ACTION_SAVE_EXPERIENCE:
          isUserAction = true;
          handleActionSaveExperience(intent.getStringExtra(MANIFEST_URL_KEY));
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

  private void handleActionInfoScreen(String manifestUrl) {
    BaseExperienceActivity activity = BaseExperienceActivity.getVisibleActivity();

    if (activity != null) {
      Intent infoIntent = new Intent(activity, InfoActivity.class);
      infoIntent.putExtra(InfoActivity.MANIFEST_URL_KEY, manifestUrl);
      infoIntent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
      activity.startActivity(infoIntent);

      Intent intent = new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
      sendBroadcast(intent);
      Analytics.logEventWithManifestUrl(Analytics.INFO_SCREEN, manifestUrl);
    }

    stopSelf();
  }

  private void handleActionReloadExperience(String manifestUrl) {
    mKernel.reloadVisibleExperience(manifestUrl);

    Intent intent = new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
    sendBroadcast(intent);
    Analytics.logEventWithManifestUrl(Analytics.RELOAD_EXPERIENCE, manifestUrl);

    stopSelf();
  }

  private void handleActionSaveExperience(final String manifestUrl) {
    Intent intent = new Intent(Intent.ACTION_CLOSE_SYSTEM_DIALOGS);
    sendBroadcast(intent);

    if (mExponentSharedPreferences.hasSavedShortcut()) {
      mKernel.installShortcut(manifestUrl);
      Analytics.logEventWithManifestUrl(Analytics.SAVE_EXPERIENCE, manifestUrl);
      stopSelf();
    } else {
      Analytics.logEventWithManifestUrl(Analytics.SAVE_EXPERIENCE_ALERT, manifestUrl);
      mKernel.getActivityContext().runOnUiThread(new Runnable() {
        @Override
        public void run() {
          showAlertDialog(manifestUrl);
        }
      });
    }
  }

  private void showAlertDialog(final String manifestUrl) {
    ExponentSharedPreferences.ManifestAndBundleUrl manifestAndBundleUrl = mExponentSharedPreferences.getManifest(manifestUrl);
    JSONObject manifestJson = manifestAndBundleUrl.manifest;
    final String name = manifestJson.optString(ExponentManifest.MANIFEST_NAME_KEY);
    final String iconUrl = manifestJson.optString(ExponentManifest.MANIFEST_ICON_URL_KEY);

    mExponentManifest.loadIconBitmap(iconUrl, new ExponentManifest.BitmapListener() {
      @Override
      public void onLoadBitmap(Bitmap bitmap) {
        Drawable drawable = new BitmapDrawable(getResources(), bitmap);
        AlertDialog dialog = new AlertDialog.Builder(mKernel.getActivityContext())
            .setTitle("Save Shortcut")
            .setMessage("This will save a shortcut to " + name + " on your home screen. Continue?")
            .setPositiveButton(android.R.string.yes, new DialogInterface.OnClickListener() {
              public void onClick(DialogInterface dialog, int which) {
                mExponentSharedPreferences.setBoolean(ExponentSharedPreferences.HAS_SAVED_SHORTCUT_KEY, true);
                mKernel.installShortcut(manifestUrl);
                Analytics.logEventWithManifestUrl(Analytics.SAVE_EXPERIENCE_OPTION_YES, manifestUrl);
                stopSelf();
              }
            })
            .setNegativeButton(android.R.string.no, new DialogInterface.OnClickListener() {
              public void onClick(DialogInterface dialog, int which) {
                Analytics.logEventWithManifestUrl(Analytics.SAVE_EXPERIENCE_OPTION_NO, manifestUrl);
                stopSelf();
              }
            })
            .setIcon(drawable)
            .show();
        dialog.getButton(DialogInterface.BUTTON_NEGATIVE).setTextColor(ContextCompat.getColor(ExponentIntentService.this, R.color.colorPrimary));
        dialog.getButton(DialogInterface.BUTTON_POSITIVE).setTextColor(ContextCompat.getColor(ExponentIntentService.this, R.color.colorPrimary));
      }
    });
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
