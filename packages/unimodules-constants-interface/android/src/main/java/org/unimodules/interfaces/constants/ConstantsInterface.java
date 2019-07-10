package org.unimodules.interfaces.constants;

import java.util.List;
import java.util.Map;

public interface ConstantsInterface {
  Map<String, Object> getConstants();
  String getAppId();
  String getAppOwnership();
  int getDeviceYearClass();
  int getStatusBarHeight();
  String getSystemVersion();
  List<String> getSystemFonts();
}
