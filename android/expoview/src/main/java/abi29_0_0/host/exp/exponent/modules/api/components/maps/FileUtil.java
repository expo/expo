package abi29_0_0.host.exp.exponent.modules.api.components.maps;

import android.content.Context;
import android.net.Uri;
import android.os.AsyncTask;

import com.facebook.common.logging.FLog;
import abi29_0_0.com.facebook.react.common.ReactConstants;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.channels.Channels;
import java.nio.channels.ReadableByteChannel;

public class FileUtil extends AsyncTask<String, Void, InputStream> {

  private final String NAME = "FileUtil";
  private final String TEMP_FILE_SUFFIX = "temp";

  private Exception exception;
  private Context context;

  public FileUtil(Context context) {
    super();

    this.context = context;
  }

  protected InputStream doInBackground(String... urls) {
    try {
      Uri fileContentUri = Uri.parse(urls[0]);

      if (fileContentUri.getScheme().startsWith("http")) {
        return getDownloadFileInputStream(context, fileContentUri);
      }
      return context.getContentResolver().openInputStream(fileContentUri);
    } catch (Exception e) {
      this.exception = e;
      FLog.e(
          ReactConstants.TAG,
          "Could not retrieve file for contentUri " + urls[0],
          e);
      return null;
    }
  }

  private InputStream getDownloadFileInputStream(Context context, Uri uri)
      throws IOException {
    final File outputDir = context.getApplicationContext().getCacheDir();
    final File file = File.createTempFile(NAME, TEMP_FILE_SUFFIX, outputDir);
    file.deleteOnExit();

    final URL url = new URL(uri.toString());
    final InputStream is = url.openStream();
    try {
      final ReadableByteChannel channel = Channels.newChannel(is);
      try {
        final FileOutputStream stream = new FileOutputStream(file);
        try {
          stream.getChannel().transferFrom(channel, 0, Long.MAX_VALUE);
          return new FileInputStream(file);
        } finally {
          stream.close();
        }
      } finally {
        channel.close();
      }
    } finally {
      is.close();
    }
  }

}
