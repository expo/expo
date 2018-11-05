package expo.interfaces.barcodescanner;

public class BarCodeScannerResult {
  private int mType;
  private String mValue;

  public BarCodeScannerResult(int type, String value) {
    mType = type;
    mValue = value;
  }

  public int getType() {
    return mType;
  }
  public String getValue() {
    return mValue;
  }
}
