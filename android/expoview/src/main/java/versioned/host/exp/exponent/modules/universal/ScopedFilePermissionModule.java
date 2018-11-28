package versioned.host.exp.exponent.modules.universal;

import java.util.EnumSet;
import expo.modules.filesystem.FilePermissionModule;
import expo.interfaces.filesystem.Permission;

public class ScopedFilePermissionModule extends FilePermissionModule {
  @Override
  protected EnumSet<Permission> getExternalPathPermissions(String path) {
    return EnumSet.noneOf(Permission.class);
  }
}
