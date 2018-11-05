package expo.interfaces.constants;

import java.util.List;
import java.util.Map;

public interface ConstantsInterface {
  Map<String, Object> getConstants();
  String getAppId();
  String getAppOwnership();
  String getDeviceName();
  int getDeviceYearClass();
  boolean getIsDevice();
  int getStatusBarHeight();
  String getSystemVersion();
  List<String> getSystemFonts();
}
