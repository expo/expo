// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.utils;

import android.net.Uri;
import androidx.core.content.FileProvider;

import org.apache.commons.codec.binary.Hex;
import org.apache.commons.codec.digest.DigestUtils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

import host.exp.expoview.Exponent;

public class ExpFileUtils {

  // http://stackoverflow.com/a/38858040/1771921
  public static Uri uriFromFile(File file) {
    return Uri.fromFile(file);
  }

  public static Uri contentUriFromFile(File file) {
    try {
      return FileProvider.getUriForFile(Exponent.getInstance().getApplication(), Exponent.getInstance().getApplication().getPackageName() + ".provider", file);
    } catch (Exception e) {
      return Uri.fromFile(file);
    }
  }

  public static File ensureDirExists(File dir) throws IOException {
    if (!(dir.isDirectory() || dir.mkdirs())) {
      throw new IOException("Couldn't create directory '" + dir + "'");
    }
    return dir;
  }

  public static String generateOutputPath(File internalDirectory, String dirName, String extension) throws IOException {
    File directory = new File(internalDirectory + File.separator + dirName);
    ExpFileUtils.ensureDirExists(directory);
    String filename = UUID.randomUUID().toString();
    return directory + File.separator + filename + extension;
  }

  public static String md5(File file) throws IOException {
    InputStream is = new FileInputStream(file);
    try {
      byte[] md5bytes = DigestUtils.md5(is);
      return String.valueOf(Hex.encodeHex(md5bytes));
    } finally {
      is.close();
    }
  }
}
