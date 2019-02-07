package expo.modules.imagemanipulator;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

class FileUtils {
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
