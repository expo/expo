package org.unimodules.interfaces.barcodescanner;

public enum BarCodeScannerSettingsKey {
  TYPES("barCodeTypes");

  private final String mName;

  BarCodeScannerSettingsKey(String stringName) {
    mName = stringName;
  }

  public static BarCodeScannerSettingsKey fromStringName(String name) {
    for (BarCodeScannerSettingsKey key: BarCodeScannerSettingsKey.values()) {
      if (key.getName().equalsIgnoreCase(name)) {
        return key;
      }
    }
    return null;
  }

  public String getName() {
    return mName;
  }
}
