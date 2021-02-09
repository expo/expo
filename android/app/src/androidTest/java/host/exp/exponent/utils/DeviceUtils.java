package host.exp.exponent.utils;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.test.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject;
import androidx.test.uiautomator.UiObjectNotFoundException;
import androidx.test.uiautomator.UiSelector;
import androidx.test.uiautomator.Until;
import android.widget.Switch;

public class DeviceUtils {

  private static final int LAUNCH_TIMEOUT = 5000;

  public static void allowDrawingOverOtherApps(UiDevice uiDevice) {
    // Start from the home screen
    uiDevice.pressHome();

    // Wait for launcher
    final String launcherPackage = uiDevice.getLauncherPackageName();
    uiDevice.wait(Until.hasObject(By.pkg(launcherPackage).depth(0)), LAUNCH_TIMEOUT);

    Context context = InstrumentationRegistry.getContext();
    // Enable draw over other apps if necessary
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
      // Open settings
      Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:host.exp.exponent"));
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
      context.startActivity(intent);

      // Wait for the app to appear
      uiDevice.wait(Until.hasObject(By.textContains("Permit drawing over other apps")), LAUNCH_TIMEOUT);

      UiObject switchObject = uiDevice.findObject(new UiSelector().className(Switch.class.getName()));
      try {
        if (!switchObject.isChecked()) {
          switchObject.click();
        }
      } catch (UiObjectNotFoundException e) {
        e.printStackTrace();
      }
    }
  }
}
