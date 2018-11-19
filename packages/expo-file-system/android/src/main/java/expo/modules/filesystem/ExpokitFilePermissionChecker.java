package expo.modules.filesystem;

import android.content.Context;

import java.io.File;
import java.io.IOException;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;

import expo.core.interfaces.InternalModule;
import main.FilePermissionChecker;
import main.Permission;

public class ExpokitFilePermissionChecker implements FilePermissionChecker, InternalModule {
  @Override
  public EnumSet<Permission> getInfo(Context context, String path) {
    try {
      path = new File(path).getCanonicalPath();
      String filesDir = context.getFilesDir().getCanonicalPath();
      if (path.startsWith(filesDir + "/")) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
      if (filesDir.equals(path)) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
      String cacheDir = context.getCacheDir().getCanonicalPath();
      if (path.startsWith(cacheDir + "/")) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
      if (cacheDir.equals(path)) {
        return EnumSet.of(Permission.READ, Permission.WRITE);
      }
    } catch (IOException e) {
      return EnumSet.noneOf(Permission.class);
    }
    return checkForPath(path);
  }

  protected EnumSet<Permission> checkForPath(String path) {
    File f = new File(path);
    if (f.canWrite() && f.canRead()) {
      return EnumSet.of(Permission.READ, Permission.WRITE);
    }
    if (f.canWrite()) {
      return EnumSet.of(Permission.WRITE);
    }
    if (f.canRead()) {
      return EnumSet.of(Permission.READ);
    }
    return EnumSet.noneOf(Permission.class);
  }

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(FilePermissionChecker.class);
  }
}
