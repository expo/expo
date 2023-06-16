package versioned.host.exp.exponent.modules.api.components.maps;

import android.content.Context;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;

import java.net.MalformedURLException;
import java.net.URL;
 
public class MapTileWorker extends Worker {
	private static final int BUFFER_SIZE = 16 * 1024;

	public MapTileWorker(
			@NonNull Context context,
			@NonNull WorkerParameters params) {
			super(context, params);
	}

	@Override
	public Result doWork() {
		byte[] image;
		URL url;
    String fileName = getInputData().getString("filename");

    try {
      int tileCacheMaxAge = getInputData().getInt("maxAge", 0);
      if (tileCacheMaxAge >= 0) {
        File file = new File(fileName);
	    	long lastModified = file.lastModified();
        long now = System.currentTimeMillis();
        if ((now - lastModified) / 1000 < tileCacheMaxAge) return Result.failure();
      }
    } catch (Error e) {
      return Result.failure();
    }

		try {
      url = new URL(getInputData().getString("url"));
    } catch (MalformedURLException e) {
      throw new AssertionError(e);
    }

		image = fetchTile(url);
		if (image != null) {
			boolean success = writeTileImage(image, fileName);
			if (!success) {
				return Result.failure();
			}
    } else {
			return Result.retry();
		}

		// Indicate whether the work finished successfully with the Result
    Log.d("urlTile", "Worker fetched " + fileName);
		return Result.success();
	}

	private byte[] fetchTile(URL url) {
      ByteArrayOutputStream buffer = null;
      InputStream in = null;

      try {
        in = url.openStream();
        buffer = new ByteArrayOutputStream();

        int nRead;
        byte[] data = new byte[BUFFER_SIZE];

        while ((nRead = in.read(data, 0, BUFFER_SIZE)) != -1) {
          buffer.write(data, 0, nRead);
        }
        buffer.flush();

        return buffer.toByteArray();
      } catch (IOException | OutOfMemoryError e) {
        e.printStackTrace();
        return null;
      } finally {
        if (in != null) try { in.close(); } catch (Exception ignored) {}
        if (buffer != null) try { buffer.close(); } catch (Exception ignored) {}
      }
    }

	private boolean writeTileImage(byte[] image, String fileName) {
      OutputStream out = null;
      if (fileName == null) {
        return false;
      }

      try {
        File file = new File(fileName);
        file.getParentFile().mkdirs();
        out = new FileOutputStream(file);
        out.write(image);

        return true;
      } catch (IOException | OutOfMemoryError e) {
        e.printStackTrace();
        return false;
      } finally {
        if (out != null) try { out.close(); } catch (Exception ignored) {}
      }
  }
}
