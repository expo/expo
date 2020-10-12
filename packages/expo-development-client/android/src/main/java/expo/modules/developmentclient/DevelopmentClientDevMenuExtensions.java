package expo.modules.developmentclient;

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
import kotlin.Unit;

public class DevelopmentClientDevMenuExtensions extends ReactContextBaseJavaModule implements DevMenuExtensionInterface {
  public DevelopmentClientDevMenuExtensions(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NotNull
  @Override
  public String getName() {
    return "ExpoDevelopmentClientDevMenuExtensions";
  }

  @Nullable
  @Override
  public List<DevMenuItem> devMenuItems() {
    DevMenuAction backToLauncher = new DevMenuAction("development-client-back-to-launcher", () -> {
      DevelopmentClientController.getInstance().navigateToLauncher();
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
