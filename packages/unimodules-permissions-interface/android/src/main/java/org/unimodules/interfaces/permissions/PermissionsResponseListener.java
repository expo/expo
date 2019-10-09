package org.unimodules.interfaces.permissions;

import java.util.Map;

public interface PermissionsResponseListener {

  void onResult(Map<String, PermissionsResponse> result);

}
