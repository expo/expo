package expo.modules.barcodescanner;

import android.content.Context;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.ViewManager;
import org.unimodules.core.interfaces.ExpoProp;

import java.util.List;
import java.util.ArrayList;

import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings;

public class BarCodeScannerViewManager extends ViewManager<BarCodeScannerView> {
  public enum Events {
    EVENT_ON_BAR_CODE_SCANNED("onBarCodeScanned");

    private final String mName;

    Events(final String name) {
      mName = name;
    }

    @Override
    public String toString() {
      return mName;
    }
  }

  private static final String TAG = "ExpoBarCodeScannerView";
  private ModuleRegistry mModuleRegistry;

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public String getName() {
    return TAG;
  }

  @Override
  public BarCodeScannerView createViewInstance(Context context) {
    return new BarCodeScannerView(context, mModuleRegistry);
  }

  @Override
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
  }

  @Override
  public List<String> getExportedEventNames() {
    List<String> eventNames = new ArrayList<>(Events.values().length);
    for(Events event : Events.values()) {
      eventNames.add(event.toString());
    }
    return eventNames;
  }

  @ExpoProp(name = "type")
  public void setType(BarCodeScannerView view, int type) {
    view.setCameraType(type);
  }

  @ExpoProp(name = "barCodeTypes")
  public void setBarCodeTypes(BarCodeScannerView view, final ArrayList<Double> barCodeTypes) {
    if (barCodeTypes == null) {
      return;
    }

    BarCodeScannerSettings settings = new BarCodeScannerSettings() {{
      putTypes(barCodeTypes);
    }};
    view.setBarCodeScannerSettings(settings);
  }
}
