package abi37_0_0.org.unimodules.interfaces.permissions;

import java.util.Map;

@FunctionalInterface
public interface PermissionsResponseListener {

  void onResult(Map<String, PermissionsResponse> result);

}
