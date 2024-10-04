package abi47_0_0.expo.modules.interfaces.constants;

import java.util.List;
import java.util.Map;

public interface ConstantsInterface {
  Map<String, Object> getConstants();
  String getAppScopeKey();
  String getAppOwnership();
  String getDeviceName();
  int getDeviceYearClass();
  boolean getIsDevice();
  int getStatusBarHeight();
  String getSystemVersion();
  List<String> getSystemFonts();
}
