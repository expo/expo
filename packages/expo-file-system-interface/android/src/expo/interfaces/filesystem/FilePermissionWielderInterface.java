package expo.interfaces.filesystem;

import android.content.Context;
import java.util.EnumSet;

public interface FilePermissionWielderInterface {
  EnumSet<Permission> getPathPermissions(Context context, String path);
}

