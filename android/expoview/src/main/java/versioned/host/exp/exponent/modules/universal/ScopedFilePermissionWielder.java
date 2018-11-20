package versioned.host.exp.exponent.modules.universal;

import java.util.EnumSet;
import expo.modules.filesystem.FilePermissionWielder;
import expo.interfaces.filesystem.Permission;

class ScopedFilePermissionWielder extends FilePermissionWielder {
  @Override
  protected EnumSet<Permission> getPermissionsIfPathIsExternal(String path) {
    return EnumSet.noneOf(Permission.class);
  }
}
