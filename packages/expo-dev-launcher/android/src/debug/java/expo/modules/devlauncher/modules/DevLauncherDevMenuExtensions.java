package expo.modules.devlauncher.modules;

import android.view.KeyEvent;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.List;

import expo.interfaces.devmenu.DevMenuExtensionInterface;
import expo.interfaces.devmenu.items.DevMenuItemImportance;
import expo.interfaces.devmenu.items.DevMenuItemsContainer;
import expo.interfaces.devmenu.items.DevMenuItemsContainerInterface;
import expo.interfaces.devmenu.items.DevMenuScreen;
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
  public DevMenuItemsContainerInterface devMenuItems() {
    DevMenuItemsContainer container = new DevMenuItemsContainer();

    container.action("dev-launcher-back-to-launcher", () -> {
      DevLauncherController.getInstance().navigateToLauncher();
      return Unit.INSTANCE;
    }, devMenuAction -> {

      devMenuAction.setEnabled(() -> true);
      devMenuAction.setLabel(() -> "Back to launcher");
      devMenuAction.setGlyphName(() -> "exit-to-app");
      devMenuAction.setImportance(DevMenuItemImportance.HIGH.getValue());
      devMenuAction.setKeyCommand(new KeyCommand(KeyEvent.KEYCODE_L, false));

      return Unit.INSTANCE;
    });
    return container;
  }

  @Nullable
  @Override
  public List<DevMenuScreen> devMenuScreens() {
    return null;
  }
}
