package abi32_0_0.expo.interfaces.filesystem;

import android.content.Context;
import java.util.EnumSet;

public interface FilePermissionModuleInterface {
  EnumSet<Permission> getPathPermissions(Context context, String path);
}

