package expo.modules.developmentclient;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;

import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.Arrays;
import java.util.List;

import expo.interfaces.devmenu.DevMenuExtensionInterface;
import expo.interfaces.devmenu.items.DevMenuAction;
import expo.interfaces.devmenu.items.DevMenuItem;
import expo.interfaces.devmenu.items.DevMenuItemImportance;
import kotlin.Unit;

public class DevelopmentClientDevMenuExtensions extends ReactContextBaseJavaModule implements DevMenuExtensionInterface {
  private final ReactApplicationContext reactContext;

  public DevelopmentClientDevMenuExtensions(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @NotNull
  @Override
  public String getName() {
    return "ExpoDevelopmentClientDevMenuExtensions";
  }

  @Nullable
  @Override
  public List<DevMenuItem> devMenuItems() {
    DevMenuItem backToLauncher = new DevMenuAction("development-client-back-to-launcher", () -> {
      DevelopmentClientController.getInstance().navigateToLauncher();
      return Unit.INSTANCE;
    });
    backToLauncher.setEnabled(() -> true);
    backToLauncher.setLabel(() -> "Back to launcher");
    backToLauncher.setGlyphName(() -> "exit-to-app");
    backToLauncher.setImportance(DevMenuItemImportance.HIGH.getValue());

    return Arrays.asList(backToLauncher);
  }
}
