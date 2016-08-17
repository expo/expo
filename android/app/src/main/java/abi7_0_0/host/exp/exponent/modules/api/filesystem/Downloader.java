// Copyright 2015-present 650 Industries. All rights reserved.

package abi7_0_0.host.exp.exponent.modules.api.filesystem;

import java.io.FileOutputStream;
import java.io.BufferedInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

import android.os.AsyncTask;

public class Downloader extends AsyncTask<DownloadParams, int[], Void> {
  private DownloadParams mParam;
  private AtomicBoolean mAbort = new AtomicBoolean(false);

  @Override
  protected Void doInBackground(DownloadParams... params) {
    mParam = params[0];
    DownloadResult res = new DownloadResult();
    try {
      this.download(mParam, res);
      mParam.onTaskCompleted.onTaskCompleted(res);
    } catch (Exception ex) {
      res.exception = ex;
      mParam.onTaskCompleted.onTaskCompleted(res);
    }
    return null;
  }

  private void download(DownloadParams param, DownloadResult res) throws IOException {
    InputStream input = null;
    OutputStream output = null;

    try {
      URL src = param.src;

      HttpURLConnection connection = (HttpURLConnection)src.openConnection();

      int status = connection.getResponseCode();
      int nRedirects = 0;
      while (nRedirects < param.maxRedirects &&
              (status == HttpURLConnection.HTTP_MOVED_TEMP ||
                      status == HttpURLConnection.HTTP_MOVED_PERM ||
                      status == HttpURLConnection.HTTP_SEE_OTHER)) {
        src = new URL(connection.getHeaderField("Location"));
        String cookies = connection.getHeaderField("Set-Cookie");
        connection = (HttpURLConnection) src.openConnection();
        connection.addRequestProperty("Cookie", cookies);
        status = connection.getResponseCode();
        ++nRedirects;
      }

      connection.setConnectTimeout(5000);
      connection.connect();

      int statusCode = connection.getResponseCode();
      int lengthOfFile = connection.getContentLength();

      Map<String, List<String>> headers = connection.getHeaderFields();

      Map<String, String> headersFlat = new HashMap<String, String>();

      for (Map.Entry<String, List<String>> entry : headers.entrySet()) {
        String headerKey = entry.getKey();
        String valueKey = entry.getValue().get(0);
        
        if (headerKey != null && valueKey != null) {
          headersFlat.put(headerKey, valueKey);
        }
      }

      mParam.onDownloadBegin.onDownloadBegin(statusCode, lengthOfFile, headersFlat);

      input = new BufferedInputStream(src.openStream(), 8 * 1024);
      output = new FileOutputStream(param.dest);

      byte data[] = new byte[8 * 1024];
      int total = 0;
      int count;

      while ((count = input.read(data)) != -1) {
        if (mAbort.get()) {
          break;
        }

        total += count;
        publishProgress(new int[] { lengthOfFile, total });
        output.write(data, 0, count);
      }

      output.flush();

      res.statusCode = statusCode;
      res.bytesWritten = total;
    } finally {
      if (output != null) output.close();
      if (input != null) input.close();
    }
  }

  protected void stop() {
    mAbort.set(true);
  }

  @Override
  protected void onProgressUpdate(int[]... values) {
    super.onProgressUpdate(values);
    mParam.onDownloadProgress.onDownloadProgress(values[0][0], values[0][1]);
  }
}
