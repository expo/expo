package expo.modules.interfaces.barcodescanner;

import java.util.HashMap;
import java.util.Map;

public class BarCodeScannerSettings extends HashMap<BarCodeScannerSettingsKey, Object> {

  public BarCodeScannerSettings() {
    super();
  }
  public BarCodeScannerSettings(Map<String, Object> settings) {
    super();
    for (Map.Entry<String, Object> entry: settings.entrySet()) {
      BarCodeScannerSettingsKey key = BarCodeScannerSettingsKey.fromStringName(entry.getKey());
      if (key != null) {
        put(key, entry.getValue());
      }
    }
  }

  public void putTypes(Object types) {
    put(BarCodeScannerSettingsKey.TYPES, types);
  }

  public Object getTypes() {
    return get(BarCodeScannerSettingsKey.TYPES);
  }
}
