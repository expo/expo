package expo.modules.imagepicker;

import android.app.Application;
import android.content.ContentResolver;
import android.net.Uri;
import android.webkit.MimeTypeMap;

import java.io.File;
import java.io.IOException;
import java.util.UUID;

import androidx.annotation.Nullable;
import androidx.core.content.FileProvider;

public class ImagePickerFileUtils {

  // http://stackoverflow.com/a/38858040/1771921
  public static Uri uriFromFile(File file) {
    return Uri.fromFile(file);
  }

  public static Uri contentUriFromFile(File file, Application application) {
    try {
      return FileProvider.getUriForFile(application, application.getPackageName() + ".ImagePickerFileProvider", file);
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


  public static  String generateOutputPath(File internalDirectory, String dirName, String extension) throws IOException {
    File directory = new File(internalDirectory + File.separator + dirName);
    ImagePickerFileUtils.ensureDirExists(directory);
    String filename = UUID.randomUUID().toString();
    return directory + File.separator + filename + extension;
  }

  @Nullable
  public static String getType(ContentResolver contentResolver, Uri uri) {
    String type = contentResolver.getType(uri);
    // previous method sometimes returns null
    if (type == null) {
      type = getTypeFromFileUrl(uri.toString());
    }

    return type;
  }

  private static String getTypeFromFileUrl(String url) {
    String extension = MimeTypeMap.getFileExtensionFromUrl(url);
    return extension != null ? MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension) : null;
  }
}
