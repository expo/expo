package expo.modules.filesystem;

import android.net.Uri;

import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import expo.core.Module;

public class FileSystem implements Module, expo.interfaces.filesystem.FileSystem {
  @Override
  public List<Class> getExportedInterfaces() {
    return Collections.singletonList((Class) expo.interfaces.filesystem.FileSystem.class);
  }

  // http://stackoverflow.com/a/38858040/1771921
  public Uri uriFromFile(File file) {
    return Uri.fromFile(file);
  }

  public Uri contentUriFromFile(File file) {
//        try {
//            return FileProvider.getUriForFile(Exponent.getInstance().getApplication(), Exponent.getInstance().getApplication().getPackageName() + ".provider", file);
//        } catch (Exception e) {
    return Uri.fromFile(file);
//        }
  }

  public File ensureDirExists(File dir) throws IOException {
    if (!(dir.isDirectory() || dir.mkdirs())) {
      throw new IOException("Couldn't create directory '" + dir + "'");
    }
    return dir;
  }

  public String generateOutputPath(File internalDirectory, String dirName, String extension) throws IOException {
    File directory = new File(internalDirectory + File.separator + dirName);
    this.ensureDirExists(directory);
    String filename = UUID.randomUUID().toString();
    return directory + File.separator + filename + extension;
  }

  public String md5(File file) throws IOException {
    InputStream is = new FileInputStream(file);
    try {
      byte[] md5bytes = DigestUtils.md5(is);
      return String.valueOf(Hex.encodeHex(md5bytes));
    } finally {
      is.close();
    }
  }
}
