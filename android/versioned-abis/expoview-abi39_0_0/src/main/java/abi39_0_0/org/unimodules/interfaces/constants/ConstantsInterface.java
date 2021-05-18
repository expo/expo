package abi39_0_0.org.unimodules.interfaces.constants;

import java.util.List;
import java.util.Map;

public interface ConstantsInterface {
  Map<String, Object> getConstants();
  String getStableLegacyAppId();
  String getAppOwnership();
  String getDeviceName();
  int getDeviceYearClass();
  boolean getIsDevice();
  int getStatusBarHeight();
  String getSystemVersion();
  List<String> getSystemFonts();
}
