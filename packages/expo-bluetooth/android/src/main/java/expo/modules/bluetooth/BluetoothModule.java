package expo.modules.bluetooth;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;

import org.unimodules.core.ExportedModule;
import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.ActivityEventListener;
import org.unimodules.core.interfaces.ActivityProvider;
import org.unimodules.core.interfaces.services.UIManager;
import org.unimodules.interfaces.permissions.Permissions;

import java.util.HashMap;
import java.util.Map;

public class BluetoothModule extends ExportedModule implements ActivityEventListener {

  protected static final String TAG = "ExpoBluetooth";

  private static final int ENABLE_REQUEST = 65072;
  private static ModuleRegistry mModuleRegistry;
  private Permissions mPermissions;

  public BluetoothModule(Context context) {
    super(context);
  }

  public static Activity getActivity() {
    if (mModuleRegistry != null) {
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      return activityProvider.getCurrentActivity();
    }
    return null;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
    mPermissions = moduleRegistry.getModule(Permissions.class);

    if (moduleRegistry != null) {
      // Register to new UIManager
      if (moduleRegistry.getModule(UIManager.class) != null) {
        moduleRegistry.getModule(UIManager.class).registerActivityEventListener(this);
      }
    }
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    return constants;
  }

  private Activity getCurrentActivity() {
    if (mModuleRegistry != null) {
      ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
      return activityProvider.getCurrentActivity();
    }
    return null;
  }

  protected final Context getApplicationContext() {
    Activity activity = getCurrentActivity();
    if (activity != null) {
      return activity.getApplicationContext();
    }
    return null;
  }

  @Override
  public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
    if (requestCode == ENABLE_REQUEST) {

    }
  }

  @Override
  public void onNewIntent(Intent intent) {
    // noop
  }
}
