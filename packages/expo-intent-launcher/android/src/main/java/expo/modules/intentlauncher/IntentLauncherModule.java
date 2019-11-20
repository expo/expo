package expo.modules.intentlauncher;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.net.Uri;
import androidx.annotation.NonNull;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.Promise;
import org.unimodules.core.arguments.ReadableArguments;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.ExpoMethod;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.core.errors.CurrentActivityNotFoundException;
import org.unimodules.core.errors.ModuleNotFoundException;
import expo.modules.intentlauncher.exceptions.ActivityAlreadyStartedException;

public class IntentLauncherModule extends ExportedModule implements ActivityEventListener {
  private static final int REQUEST_CODE = 12;
  private static final String ATTR_ACTION = "action";
  private static final String ATTR_TYPE = "type";
  private static final String ATTR_CATEGORY = "category";
  private static final String ATTR_EXTRA = "extra";
  private static final String ATTR_DATA = "data";
  private static final String ATTR_FLAGS = "flags";
  private static final String ATTR_PACKAGE_NAME = "packageName";
  private static final String ATTR_CLASS_NAME = "className";

  private Promise mPendingPromise;
  private UIManager mUIManager;
  private ActivityProvider mActivityProvider;

  public IntentLauncherModule(Context context) {
    super(context);
  }

  @Override
  public String getName() {
    return "ExpoIntentLauncher";
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider.class);
    mUIManager = moduleRegistry.getModule(UIManager.class);
  }

  @ExpoMethod
  public void startActivity(String activityAction, @NonNull ReadableArguments params, final Promise promise) {
    if (mPendingPromise != null) {
      promise.reject(new ActivityAlreadyStartedException());
      return;
    }

    Activity activity = mActivityProvider != null ? mActivityProvider.getCurrentActivity() : null;

    if (activity == null) {
      promise.reject(new CurrentActivityNotFoundException());
      return;
    }
    if (mUIManager == null) {
      promise.reject(new ModuleNotFoundException("UIManager"));
      return;
    }
    
    Intent intent = new Intent(activityAction);
    
    if (params.containsKey(ATTR_CLASS_NAME)) {
      ComponentName cn = params.containsKey(ATTR_PACKAGE_NAME)
          ? new ComponentName(params.getString(ATTR_PACKAGE_NAME), params.getString(ATTR_CLASS_NAME))
          : new ComponentName(getContext(), params.getString(ATTR_CLASS_NAME));

      intent.setComponent(cn);
    }

    // `setData` and `setType` are exclusive, so we need to use `setDateAndType` in that case.
    if (params.containsKey(ATTR_DATA) && params.containsKey(ATTR_TYPE)) {
      intent.setDataAndType(Uri.parse(params.getString(ATTR_DATA)), params.getString(ATTR_TYPE));
    } else {
      if (params.containsKey(ATTR_DATA)) {
        intent.setData(Uri.parse(params.getString(ATTR_DATA)));
      }
      if (params.containsKey(ATTR_TYPE)) {
        intent.setType(params.getString(ATTR_TYPE));
      }
    }

    if (params.containsKey(ATTR_EXTRA)) {
      intent.putExtras(params.getArguments(ATTR_EXTRA).toBundle());
    }
    if (params.containsKey(ATTR_FLAGS)) {
      intent.addFlags(params.getInt(ATTR_FLAGS));
    }
    if (params.containsKey(ATTR_CATEGORY)) {
      intent.addCategory(params.getString(ATTR_CATEGORY));
    }

    mUIManager.registerActivityEventListener(this);
    mPendingPromise = promise;
    activity.startActivityForResult(intent, REQUEST_CODE);
  }

  //region ActivityEventListener

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
    if (requestCode != REQUEST_CODE) {
      return;
    }

    Bundle response = new Bundle();

    response.putInt("resultCode", resultCode);

    if (intent != null) {
      Uri data = intent.getData();
      if (data != null) {
        response.putString(ATTR_DATA, data.toString());
      }

      Bundle extras = intent.getExtras();
      if (extras != null) {
        response.putBundle(ATTR_EXTRA, extras);
      }
    }
    if (mPendingPromise != null) {
      mPendingPromise.resolve(response);
      mPendingPromise = null;
    }
    if (mUIManager != null) {
      mUIManager.unregisterActivityEventListener(this);
    }
  }

  @Override
  public void onNewIntent(Intent intent) {}

  //endregion
}
