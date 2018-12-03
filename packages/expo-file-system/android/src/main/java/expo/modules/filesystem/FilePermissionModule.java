package expo.modules.filesystem;

import android.content.Context;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.List;

import expo.core.interfaces.InternalModule;
import expo.interfaces.filesystem.FilePermissionModuleInterface;
import expo.interfaces.filesystem.Permission;

public class FilePermissionModule implements FilePermissionModuleInterface, InternalModule {

  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.<Class>singletonList(FilePermissionModuleInterface.class);
  }

  @Override
  public EnumSet<Permission> getPathPermissions(Context context, final String path) {
    EnumSet<Permission> permissions = getInternalPathPermissions(path, context);
    if (permissions == null) {
      permissions = getExternalPathPermissions(path);
    }

    // getExternalPathPermissions guarantees not to return null
    return permissions;
  }

  protected EnumSet<Permission> getInternalPathPermissions(final String path, Context context) {
    try {
      String canonicalPath = new File(path).getCanonicalPath();
      for (String dir : getInternalPaths(context)) {
        if (canonicalPath.startsWith(dir + "/") || dir.equals(canonicalPath)) {
          return EnumSet.of(Permission.READ, Permission.WRITE);
        }
      }
    } catch (IOException e) {
      return EnumSet.noneOf(Permission.class);
    }
    return null;
  }

  protected EnumSet<Permission> getExternalPathPermissions(final String path) {
    File file = new File(path);
    if (file.canWrite() && file.canRead()) {
      return EnumSet.of(Permission.READ, Permission.WRITE);
    }
    if (file.canWrite()) {
      return EnumSet.of(Permission.WRITE);
    }
    if (file.canRead()) {
      return EnumSet.of(Permission.READ);
    }
    return EnumSet.noneOf(Permission.class);
  }

  protected List<String> getInternalPaths(Context context) throws IOException {
    return Arrays.asList(
        context.getFilesDir().getCanonicalPath(),
        context.getCacheDir().getCanonicalPath()
    );
  }
}
