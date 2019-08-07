package expo.modules.ota;

import android.content.Context;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;

import okhttp3.CacheControl;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.BufferedSource;
import okio.Okio;
import okio.Source;

public class BundleDownloader {

  public static class FallbackResponse {
    public final String url;
    public final String mediaType;
    public final String filePath;

    public FallbackResponse(String url, String mediaType, String filePath) {
      this.url = url;
      this.mediaType = mediaType;
      this.filePath = filePath;
    }
  }

  public enum ResponseSource {
    NETWORK, CACHE, EMBEDDED
  }

  public interface BundleDownloadCallback {

    void onSuccess(Response response, ResponseSource source);

    void onError(Exception error);

  }

  private final OkHttpClient okHttpClient;
  private final List<FallbackResponse> fallbackResponses;
  private final Context context;

  private boolean executed = false;
  private boolean responseYielded = false;

  private Response obtainedResponse;
  private ResponseSource responseSource;
  private Exception error;
  private BundleDownloadCallback callback;

  public BundleDownloader(Context context, OkHttpClient okHttpClient, List<FallbackResponse> fallbackResponses) {
    this.context = context;
    this.okHttpClient = okHttpClient;
    this.fallbackResponses = fallbackResponses;
  }

  public void downloadBundle(Request request, boolean shouldForceNetwork, @Nullable Map<String, String> headers, @NonNull final BundleDownloadCallback callback) {
    if (executed) {
      throw new IllegalStateException("Create new BundleDownloader for new download!");
    } else {
      executed = true;
    }

    this.callback = callback;
    tryDownload(request, shouldForceNetwork);
  }

  private void tryDownload(Request request, boolean shouldForceNetwork) {
    Request.Builder builder = request.newBuilder();
    if (shouldForceNetwork) {
      builder.cacheControl(CacheControl.FORCE_NETWORK).build();
    }

    okHttpClient.newCall(builder.build()).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        chainError(e);
        tryForceCache(call.request());
      }

      @Override
      public void onResponse(Call call, Response response) {
        BundleDownloader.this.obtainedResponse = response;
        BundleDownloader.this.responseSource = ResponseSource.NETWORK;
        if (response.isSuccessful()) {
          yieldResponse();
        } else {
          tryForceCache(call.request());
        }
      }
    });
  }

  private void chainError(IOException e) {
    if (this.error != null) {
      e.initCause(this.error);
    }
    this.error = e;
  }

  private void yieldResponse() {
    if (responseYielded) {
      throw new IllegalStateException("Trying to respond second time from the same request!");
    }
    responseYielded = true;
    callback.onSuccess(obtainedResponse, responseSource);
  }

  private void yieldError() {
    if (responseYielded) {
      throw new IllegalStateException("Trying to respond second time from the same request!");
    }
    responseYielded = true;
    callback.onError(this.error);
  }

  private void tryForceCache(Request request) {
    Request.Builder requestBuilder = request.newBuilder()
        .cacheControl(CacheControl.FORCE_CACHE)
        .header("exponentignoreinterceptors", "blah");

    okHttpClient.newCall(requestBuilder.build()).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        chainError(e);
        tryHardcodedResponse(call.request());
      }

      @Override
      public void onResponse(Call call, Response response) {
        BundleDownloader.this.obtainedResponse = response;
        BundleDownloader.this.responseSource = ResponseSource.CACHE;
        if (response.isSuccessful()) {
          yieldResponse();
        } else {
          tryHardcodedResponse(call.request());
        }
      }
    });
  }

  private void tryHardcodedResponse(Request request) {
    try {
      for (FallbackResponse embeddedResponse : fallbackResponses) {
        String normalizedUri = normalizeUri(request.url());
        // We only want to use embedded responses once. After they are used they will be added
        // to the OkHttp cache and we should use the version from that cache. We don't want a situation
        // where we have version 1 of a manifest saved as the embedded response, get version 2 saved
        // to the OkHttp cache, cache gets evicted, and we regress to version 1. Want to only use
        // monotonically increasing manifest versions.
        if (normalizedUri.equals(normalizeUri(HttpUrl.get(embeddedResponse.url)))) {
          Response response = new Response.Builder()
              .request(request)
              .protocol(Protocol.HTTP_1_1)
              .code(200)
              .message("OK")
              .body(responseBodyForFile(embeddedResponse.filePath, MediaType.parse(embeddedResponse.mediaType)))
              .build();
          this.obtainedResponse = response;
          this.responseSource = ResponseSource.EMBEDDED;
          yieldResponse();
          return;
        }
      }
    } catch (Throwable ignore) {
    }

    if (obtainedResponse != null) {
      yieldResponse();
    } else if (error != null) {
      yieldError();
    } else {
      chainError(new IOException("No hard coded response found"));
      yieldError();
    }
  }

  private ResponseBody responseBodyForFile(final String assetsPath, final MediaType contentType) {
    try {
      String strippedAssetsPath = assetsPath;
      if (strippedAssetsPath.startsWith("assets://")) {
        strippedAssetsPath = strippedAssetsPath.substring("assets://".length());
      }

      InputStream stream = context.getAssets().open(strippedAssetsPath);
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
      return null;
    } catch (IOException e) {
      return null;
    }
  }

  private static String normalizeUri(final HttpUrl url) {
    int port = url.port();
    if (port == -1) {
      if (url.scheme().equals("http")) {
        port = 80;
      } else if (url.scheme().equals("https")) {
        port = 443;
      }
    }

    HttpUrl.Builder urlBuilder = url.newBuilder();
    urlBuilder.port(port);

    return urlBuilder.build().toString();
  }

}
