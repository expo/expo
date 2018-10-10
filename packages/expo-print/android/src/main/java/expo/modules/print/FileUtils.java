// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.print;

import android.net.Uri;
import java.io.File;
import java.io.IOException;
import java.util.UUID;

public class FileUtils {

  // http://stackoverflow.com/a/38858040/1771921
  public static Uri uriFromFile(File file) {
    return Uri.fromFile(file);
  }

  public static File ensureDirExists(File dir) throws IOException {
    if (!(dir.isDirectory() || dir.mkdirs())) {
      throw new IOException("Couldn't create directory '" + dir + "'");
    }
    return dir;
  }

  public static String generateOutputPath(File internalDirectory, String dirName, String extension) throws IOException {
    File directory = new File(internalDirectory + File.separator + dirName);
    FileUtils.ensureDirExists(directory);
    String filename = UUID.randomUUID().toString();
    return directory + File.separator + filename + extension;
  }

}
