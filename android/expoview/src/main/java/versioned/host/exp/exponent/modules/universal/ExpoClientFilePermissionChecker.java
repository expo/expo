package versioned.host.exp.exponent.modules.universal;

import java.util.EnumSet;
import expo.modules.filesystem.ExpokitFilePermissionChecker;
import main.Permission;

class ExpoClientFilePermissionChecker extends ExpokitFilePermissionChecker {
  @Override
  protected EnumSet<Permission> checkForPath(String path) {
    return EnumSet.noneOf(Permission.class);
  }
}
