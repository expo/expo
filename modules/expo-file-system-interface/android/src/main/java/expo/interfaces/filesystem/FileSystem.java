package expo.interfaces.filesystem;

import android.net.Uri;

import java.io.File;
import java.io.IOException;

public interface FileSystem {
  Uri uriFromFile(File file);

  Uri contentUriFromFile(File file);

  File ensureDirExists(File dir) throws IOException;

  String generateOutputPath(File internalDirectory, String dirName, String extension) throws IOException;

  String md5(File file) throws IOException;
}
