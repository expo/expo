package expo.modules.devlauncher.modules;

import android.view.KeyEvent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.Collections;
import java.util.List;

import expo.interfaces.devmenu.DevMenuExtensionInterface;
import expo.interfaces.devmenu.items.DevMenuAction;
import expo.interfaces.devmenu.items.DevMenuItem;
import expo.interfaces.devmenu.items.DevMenuItemImportance;
import expo.interfaces.devmenu.items.KeyCommand;
import expo.modules.devlauncher.DevLauncherController;
import kotlin.Unit;

public class DevLauncherDevMenuExtensions extends ReactContextBaseJavaModule implements DevMenuExtensionInterface {
  public DevLauncherDevMenuExtensions(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NotNull
  @Override
  public String getName() {
    return "ExpoDevLauncherDevMenuExtensions";
  }

  @Nullable
  @Override
  public List<DevMenuItem> devMenuItems() {
    DevMenuAction backToLauncher = new DevMenuAction("dev-launcher-back-to-launcher", () -> {
      DevLauncherController.getInstance().navigateToLauncher();
      return Unit.INSTANCE;
    });
    backToLauncher.setEnabled(() -> true);
    backToLauncher.setLabel(() -> "Back to launcher");
    backToLauncher.setGlyphName(() -> "exit-to-app");
    backToLauncher.setImportance(DevMenuItemImportance.HIGH.getValue());
    backToLauncher.setKeyCommand(new KeyCommand(KeyEvent.KEYCODE_L, false));
    return Collections.singletonList(backToLauncher);
  }
}
