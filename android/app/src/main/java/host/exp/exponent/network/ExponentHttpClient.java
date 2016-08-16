// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.network;

import android.content.Context;

import com.amplitude.api.Amplitude;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;

import host.exp.exponent.Constants;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import okhttp3.CacheControl;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.BufferedSource;
import okio.Okio;
import okio.Source;

public class ExponentHttpClient {

  private static final String TAG = ExponentHttpClient.class.getSimpleName();

  public interface SafeCallback {
    void onFailure(Call call, IOException e);
    void onResponse(Call call, Response response);
    void onErrorCacheResponse(Call call, Response response);
  }

  private Context mContext;
  private OkHttpClient mOkHttpClient;

  protected ExponentHttpClient(final Context context, final OkHttpClient httpClient) {
    mContext = context;
    mOkHttpClient = httpClient;
  }

  protected OkHttpClient getOkHttpClient() {
    return mOkHttpClient;
  }

  public void call(final Request request, final Callback callback) {
    mOkHttpClient.newCall(request).enqueue(callback);
  }

  public void callSafe(final Request request, final SafeCallback callback) {
    final String uri = request.url().toString();

    mOkHttpClient.newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        tryForcedCachedResponse(uri, request, callback, null, e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        if (response.isSuccessful()) {
          callback.onResponse(call, response);
        } else {
          tryForcedCachedResponse(uri, request, callback, response, null);
        }
      }
    });
  }

  private void tryForcedCachedResponse(final String uri, final Request request, final SafeCallback callback, final Response initialResponse, final IOException initialException) {
    Request newRequest = request.newBuilder()
        .cacheControl(CacheControl.FORCE_CACHE)
        .header(ExponentNetwork.IGNORE_INTERCEPTORS_HEADER, "blah")
        .build();
    mOkHttpClient.newCall(newRequest).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        tryHardCodedResponse(uri, call, callback, initialResponse, initialException);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        if (response.isSuccessful()) {
          callback.onErrorCacheResponse(call, response);
          logEventWithUri(Analytics.HTTP_ERROR_USED_CACHE_RESPONSE, uri);
        } else {
          tryHardCodedResponse(uri, call, callback, initialResponse, initialException);
        }
      }
    });
  }

  private void tryHardCodedResponse(final String uri, final Call call, final SafeCallback callback, final Response initialResponse, final IOException initialException) {
    try {
      for (Constants.EmbeddedResponse embeddedResponse : Constants.EMBEDDED_RESPONSES) {
        if (uri.equals(embeddedResponse.url)) {
          Response response = new Response.Builder()
              .request(call.request())
              .protocol(Protocol.HTTP_1_1)
              .code(200)
              .message("OK")
              .body(responseBodyForFile(embeddedResponse.responseFilePath, MediaType.parse(embeddedResponse.mediaType)))
              .build();
          callback.onErrorCacheResponse(call, response);
          logEventWithUri(Analytics.HTTP_ERROR_USED_EMBEDDED_RESPONSE, uri);
          return;
        }
      }
    } catch (RuntimeException e) {
      EXL.e(TAG, e);
    }

    if (initialResponse != null) {
      callback.onResponse(call, initialResponse);
    } else if (initialException != null) {
      callback.onFailure(call, initialException);
    } else {
      // How did we get here??
      throw new RuntimeException("Didn't have initialResponse or initialException in ExponentHttpClient.tryHardCodedResponse");
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
      Amplitude.getInstance().logEvent(event, eventProperties);
    } catch (JSONException e) {
      EXL.e(TAG, e);
    }
  }
}
