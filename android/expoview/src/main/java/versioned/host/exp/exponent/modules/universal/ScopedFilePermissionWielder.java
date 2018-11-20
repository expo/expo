package versioned.host.exp.exponent.modules.universal;

import java.util.EnumSet;
import expo.modules.filesystem.FilePermissionChecker;
import expo.interfaces.filesystem.Permission;

class ScopedFilePermissionWielder extends FilePermissionChecker {
  @Override
  protected EnumSet<Permission> getInfoAboutOtherPaths(String path) {
    return EnumSet.noneOf(Permission.class);
  }
}
