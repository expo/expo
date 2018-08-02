// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.network;

import android.content.Context;

import org.apache.commons.io.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import expolib_v1.okhttp3.CacheControl;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.MediaType;
import expolib_v1.okhttp3.Protocol;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import expolib_v1.okhttp3.ResponseBody;
import expolib_v1.okio.BufferedSource;
import expolib_v1.okio.Okio;
import expolib_v1.okio.Source;
import host.exp.exponent.storage.ExponentSharedPreferences;

public class ExponentHttpClient {
  ExponentSharedPreferences mExponentSharedPreferences;

  private static final String TAG = ExponentHttpClient.class.getSimpleName();

  public interface SafeCallback {
    void onFailure(IOException e);
    void onResponse(ExpoResponse response);
    void onCachedResponse(ExpoResponse response, boolean isEmbedded);
  }

  private Context mContext;
  private ExponentNetwork.OkHttpClientFactory mOkHttpClientFactory;

  protected ExponentHttpClient(final Context context, final ExponentSharedPreferences exponentSharedPreferences, final ExponentNetwork.OkHttpClientFactory httpClientFactory) {
    mContext = context;
    mOkHttpClientFactory = httpClientFactory;
    mExponentSharedPreferences = exponentSharedPreferences;
  }

  public void call(final Request request, final ExpoHttpCallback callback) {
    mOkHttpClientFactory.getNewClient().newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        callback.onFailure(e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        callback.onResponse(new OkHttpV1ExpoResponse(response));
      }
    });
  }

  public void callSafe(final Request request, final SafeCallback callback) {
    final String uri = request.url().toString();

    mOkHttpClientFactory.getNewClient().newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        tryForcedCachedResponse(uri, request, callback, null, e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        if (response.isSuccessful()) {
          callback.onResponse(new OkHttpV1ExpoResponse(response));
        } else {
          tryForcedCachedResponse(uri, request, callback, response, null);
        }
      }
    });
  }

  public void callDefaultCache(final Request request, final SafeCallback callback) {
    final String uri = request.url().toString();

    tryForcedCachedResponse(uri, request, new SafeCallback() {

      @Override
      public void onFailure(IOException e) {
        call(request, new ExpoHttpCallback() {
          @Override
          public void onFailure(IOException e) {
            callback.onFailure(e);
          }

          @Override
          public void onResponse(ExpoResponse response) throws IOException {
            callback.onResponse(response);
          }
        });
      }

      @Override
      public void onResponse(ExpoResponse response) {
        callback.onResponse(response);
      }

      @Override
      public void onCachedResponse(ExpoResponse response, boolean isEmbedded) {
        callback.onCachedResponse(response, isEmbedded);

        // You are responsible for updating the cache!
      }
    }, null, null);
  }

  public void tryForcedCachedResponse(final String uri, final Request request, final SafeCallback callback, final Response initialResponse, final IOException initialException) {
    Request newRequest = request.newBuilder()
        .cacheControl(CacheControl.FORCE_CACHE)
        .header(ExponentNetwork.IGNORE_INTERCEPTORS_HEADER, "blah")
        .build();
    mOkHttpClientFactory.getNewClient().newCall(newRequest).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        tryHardCodedResponse(uri, call, callback, initialResponse, initialException);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        if (response.isSuccessful()) {
          callback.onCachedResponse(new OkHttpV1ExpoResponse(response), false);
          logEventWithUri(Analytics.HTTP_USED_CACHE_RESPONSE, uri);
        } else {
          tryHardCodedResponse(uri, call, callback, initialResponse, initialException);
        }
      }
    });
  }

  private static String normalizeUri(final String uriString) {
    try {
      URL url = new URL(uriString);
      int port = url.getPort();
      if (port == -1) {
        if (url.getProtocol().equals("http")) {
          port = 80;
        } else if (url.getProtocol().equals("https")) {
          port = 443;
        }
      }

      URI uri = new URI(url.getProtocol(), url.getUserInfo(), url.getHost(), port, url.getPath(), url.getQuery(), url.getRef());

      return uri.toString();
    } catch (MalformedURLException | URISyntaxException e) {
      return uriString;
    }
  }

  public String getHardCodedResponse(final String uri) {
    try {
      for (Constants.EmbeddedResponse embeddedResponse : Constants.EMBEDDED_RESPONSES) {
        String normalizedUri = normalizeUri(uri);

        if (normalizedUri.equals(normalizeUri(embeddedResponse.url))) {

          String strippedAssetsPath = embeddedResponse.responseFilePath;
          if (strippedAssetsPath.startsWith("assets://")) {
            strippedAssetsPath = strippedAssetsPath.substring("assets://".length());
          }

          InputStream stream = mContext.getAssets().open(strippedAssetsPath);
          return IOUtils.toString(stream, "UTF-8");
        }
      }
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }

    return null;
  }

  private void tryHardCodedResponse(final String uri, final Call call, final SafeCallback callback, final Response initialResponse, final IOException initialException) {
    try {
      for (Constants.EmbeddedResponse embeddedResponse : Constants.EMBEDDED_RESPONSES) {
        String normalizedUri = normalizeUri(uri);
        // We only want to use embedded responses once. After they are used they will be added
        // to the OkHttp cache and we should use the version from that cache. We don't want a situation
        // where we have version 1 of a manifest saved as the embedded response, get version 2 saved
        // to the OkHttp cache, cache gets evicted, and we regress to version 1. Want to only use
        // monotonically increasing manifest versions.
        if (normalizedUri.equals(normalizeUri(embeddedResponse.url))) {
          Response response = new Response.Builder()
              .request(call.request())
              .protocol(Protocol.HTTP_1_1)
              .code(200)
              .message("OK")
              .body(responseBodyForFile(embeddedResponse.responseFilePath, MediaType.parse(embeddedResponse.mediaType)))
              .build();
          callback.onCachedResponse(new OkHttpV1ExpoResponse(response), true);
          logEventWithUri(Analytics.HTTP_USED_EMBEDDED_RESPONSE, uri);
          return;
        }
      }
    } catch (Throwable e) {
      EXL.e(TAG, e);
    }

    if (initialResponse != null) {
      callback.onResponse(new OkHttpV1ExpoResponse(initialResponse));
    } else if (initialException != null) {
      callback.onFailure(initialException);
    } else {
      callback.onFailure(new IOException("No hard coded response found"));
    }
  }

  private ResponseBody responseBodyForFile(final String assetsPath, final MediaType contentType) {
    try {
      String strippedAssetsPath = assetsPath;
      if (strippedAssetsPath.startsWith("assets://")) {
        strippedAssetsPath = strippedAssetsPath.substring("assets://".length());
      }

      InputStream stream = mContext.getAssets().open(strippedAssetsPath);
      Source source = Okio.source(stream);
      final BufferedSource buffer = Okio.buffer(source);

      return new ResponseBody() {
        @Override
        public MediaType contentType() {
          return contentType;
        }

        @Override
        public long contentLength() {
          return -1;
        }

        @Override
        public BufferedSource source() {
          return buffer;
        }
      };
    } catch (FileNotFoundException e) {
      EXL.e(TAG, e);
      return null;
    } catch (IOException e) {
      EXL.e(TAG, e);
      return null;
    }
  }

  private void logEventWithUri(final String event, final String uri) {
    try {
      JSONObject eventProperties = new JSONObject();
      eventProperties.put("URI", uri);
      Analytics.logEvent(event, eventProperties);
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }
  }
}
