// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.network;

import android.content.Context;
import android.content.res.Resources;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;
import java.util.List;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;
import javax.inject.Singleton;

import expolib_v1.okhttp3.Cache;
import expolib_v1.okhttp3.Interceptor;
import expolib_v1.okhttp3.OkHttpClient;
import expolib_v1.okhttp3.Protocol;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;
import expolib_v1.okhttp3.ResponseBody;
import expolib_v1.okio.BufferedSource;
import expolib_v1.okio.Okio;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.ExpoViewBuildConfig;

@Singleton
public class ExponentNetwork {

  public static final String IGNORE_INTERCEPTORS_HEADER = "exponentignoreinterceptors";

  private static final String CACHE_DIR = "okhttp";
  private static final int ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

  private Context mContext;
  private ExponentHttpClient mClient;
  private ExponentHttpClient mLongTimeoutClient;
  private OkHttpClient mNoCacheClient;

  // This fixes OkHttp bug where if you don't read a response, it'll never cache that request in the future
  public static void flushResponse(ExpoResponse response) throws IOException {
    response.body().bytes();
  }

  public interface OkHttpClientFactory {
    OkHttpClient getNewClient();
  }

  @Inject
  public ExponentNetwork(Context context, ExponentSharedPreferences exponentSharedPreferences) {
    mContext = context.getApplicationContext();

    mClient = new ExponentHttpClient(mContext, exponentSharedPreferences, new OkHttpClientFactory() {
      @Override
      public OkHttpClient getNewClient() {
        return createHttpClientBuilder().build();
      }
    });

    mLongTimeoutClient = new ExponentHttpClient(mContext, exponentSharedPreferences, new OkHttpClientFactory() {
      @Override
      public OkHttpClient getNewClient() {
        OkHttpClient longTimeoutHttpClient = createHttpClientBuilder()
            .readTimeout(2, TimeUnit.MINUTES)
            .build();
        return longTimeoutHttpClient;
      }
    });

    mNoCacheClient = new OkHttpClient.Builder().build();
  }

  private OkHttpClient.Builder createHttpClientBuilder() {
    OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder()
        .cache(getCache());
    if (ExpoViewBuildConfig.DEBUG) {
      // FIXME: 8/9/17
      // clientBuilder.addNetworkInterceptor(new StethoInterceptor());
    }
    addInterceptors(clientBuilder);

    return clientBuilder;
  }

  public ExponentHttpClient getClient() {
    return mClient;
  }

  public ExponentHttpClient getLongTimeoutClient() {
    return mLongTimeoutClient;
  }

  // Warning: this doesn't WRITE to the cache either. Don't use this to populate the cache in the background.
  public OkHttpClient getNoCacheClient() {
    return mNoCacheClient;
  }

  public Cache getCache() {
    int cacheSize = 40 * 1024 * 1024; // 40 MiB

    // Use getFilesDir() because it gives us much more space than getCacheDir()
    final File directory = new File(mContext.getFilesDir(), CACHE_DIR);
    return new Cache(directory, cacheSize);
  }
  public boolean isNetworkAvailable() {
    return isNetworkAvailable(mContext);
  }

  public static boolean isNetworkAvailable(final Context context) {
    ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
    NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
    return activeNetworkInfo != null && activeNetworkInfo.isConnected();
  }

  public void addInterceptors(OkHttpClient.Builder clientBuilder) {
    // TODO(janic): Either backport bundled assets from sdk25 or remove
    // when sdk24 is no longer supported.
    Interceptor bundledAssetsInterceptor = new Interceptor() {
      @Override
      public Response intercept(Chain chain) throws IOException {
        Request originalRequest = chain.request();
        String urlString = originalRequest.url().toString();

        // Check if assets loaded from the cdn were included in the bundle.
        if (urlString.startsWith("https://d1wp6m56sqw74a.cloudfront.net/~assets/")) {
          List<String> path = originalRequest.url().pathSegments();
          String assetName = "asset_" + path.get(path.size() - 1);
          InputStream inputStream = null;
          try {
            inputStream = mContext.getAssets().open(assetName);
          } catch (IOException ex) {
            // The file doesn't exists in the bundle, fallback to network.
          }
          if (inputStream != null) {
            BufferedSource buffer = Okio.buffer(Okio.source(inputStream));
            ResponseBody body = ResponseBody.create(null, -1, buffer);
            return new Response.Builder()
                .request(originalRequest)
                .protocol(Protocol.HTTP_1_1)
                // Don't cache local assets to save disk space.
                .addHeader("Cache-Control", "no-cache")
                .body(body)
                .code(200)
                .build();
          }
        }
        return chain.proceed(originalRequest);
      }
    };

    Interceptor offlineInterceptor = new Interceptor() {
      @Override
      public Response intercept(Chain chain) throws IOException {
        boolean isNetworkAvailable = isNetworkAvailable();
        // Request
        Request originalRequest = chain.request();
        if (originalRequest.header(IGNORE_INTERCEPTORS_HEADER) != null) {
          return noopInterceptor(chain, originalRequest);
        }

        Request request;
        if (isNetworkAvailable) {
          request = originalRequest.newBuilder()
              .removeHeader("Cache-Control")
              .build();
        } else {
          // If network isn't available we don't care if the cache is stale.
          request = originalRequest.newBuilder()
              .header("Cache-Control", "max-stale=" + ONE_YEAR_IN_SECONDS)
              .build();
        }

        // Response
        Response response = chain.proceed(request);
        String responseCacheHeaderValue;
        if (isNetworkAvailable) {
          String currentResponseHeader = response.header("Cache-Control");
          if (currentResponseHeader != null && currentResponseHeader.contains("public") &&
              (currentResponseHeader.contains("max-age") || currentResponseHeader.contains("s-maxage"))) {
            // Server sent back caching instructions, follow them
            responseCacheHeaderValue = currentResponseHeader;
          } else {
            // Server didn't send Cache-Control header or told us not to cache. Tell OkHttp
            // to cache the response but invalidate it after 0 seconds. This will allow us
            // to access the response with max-stale if the network is turned off.
            responseCacheHeaderValue = "public, max-age=0";
          }
        } else {
          // Only read from the cache, don't try to hit the network
          responseCacheHeaderValue = "public, only-if-cached";
        }

        return response.newBuilder()
            .removeHeader("Pragma")
            .removeHeader("Cache-Control")
            .header("Cache-Control", responseCacheHeaderValue)
            .build();
      }
    };


    clientBuilder.addInterceptor(bundledAssetsInterceptor);
    clientBuilder.addInterceptor(offlineInterceptor);
    clientBuilder.addNetworkInterceptor(offlineInterceptor);
  }

  private static Response noopInterceptor(Interceptor.Chain chain, Request originalRequest) throws IOException {
    Request request = originalRequest.newBuilder().removeHeader(IGNORE_INTERCEPTORS_HEADER).build();
    return chain.proceed(request);
  }
}
