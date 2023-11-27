package expo.modules.interfaces.filesystem;

import android.content.Context;
import java.util.EnumSet;

public interface FilePermissionModuleInterface {
  EnumSet<Permission> getPathPermissions(Context context, String path);
}

