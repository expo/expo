package expo.modules.permissions;

import android.content.Context;
import android.support.v4.content.ContextCompat;

import java.util.Collections;
import java.util.List;

import expo.core.interfaces.InternalModule;
import expo.interfaces.permissions.Permissions;

public class PermissionsService implements InternalModule, Permissions {
  private Context mContext;
  public PermissionsService(Context context) {
    mContext = context;
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(Permissions.class);
  }

  @Override
  public int[] getPermissions(String[] permissions) {
    int[] results = new int[permissions.length];
    for (int i = 0; i < permissions.length; i++) {
      results[i] = getPermission(permissions[i]);
    }
    return results;
  }

  @Override
  public int getPermission(String permission) {
    return ContextCompat.checkSelfPermission(mContext, permission);
  }
}
