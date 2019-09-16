package org.unimodules.interfaces.permissions;

import java.util.Map;

public interface PermissionsResponse {
  String STATUS_KEY = "status";
  String GRANTED_KEY = "granted";
  String EXPIRES_KEY = "expires";
  String PERMISSION_EXPIRES_NEVER = "never";

  void onResult(Map<String, PermissionsStatus> result);
}
