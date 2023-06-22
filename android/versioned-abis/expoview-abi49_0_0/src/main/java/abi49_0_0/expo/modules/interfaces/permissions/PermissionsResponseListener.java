package abi49_0_0.expo.modules.interfaces.permissions;

import java.util.Map;

@FunctionalInterface
public interface PermissionsResponseListener {

  void onResult(Map<String, PermissionsResponse> result);

}
