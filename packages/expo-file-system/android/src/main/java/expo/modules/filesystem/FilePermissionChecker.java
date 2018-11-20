package expo.modules.filesystem;

import android.content.Context;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;

import expo.core.interfaces.InternalModule;
import expo.interfaces.filesystem.FilePermissionWielderInterface;
import expo.interfaces.filesystem.Permission;

public class FilePermissionChecker implements FilePermissionWielderInterface, InternalModule {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(FilePermissionWielderInterface.class);
  }

  @Override
  public EnumSet<Permission> getInfo(Context context, String path) {
    try {
      path = new File(path).getCanonicalPath();
      String filesDir = context.getFilesDir().getCanonicalPath();
      String cacheDir = context.getCacheDir().getCanonicalPath();

      for(String dir : Arrays.asList(filesDir, cacheDir)) {
        if (path.startsWith(dir + "/") || dir.equals(path)) {
          return EnumSet.of(Permission.READ, Permission.WRITE);
        }
      }
    } catch (IOException e) {
      return EnumSet.noneOf(Permission.class);
    }
    return getInfoAboutOtherPaths(path);
  }

  protected EnumSet<Permission> getInfoAboutOtherPaths(String path) {
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

}
