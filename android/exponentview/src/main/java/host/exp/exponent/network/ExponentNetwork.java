// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.network;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import com.facebook.stetho.okhttp3.StethoInterceptor;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;
import javax.inject.Singleton;

import host.exp.exponentview.BuildConfig;
import okhttp3.Cache;
import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

@Singleton
public class ExponentNetwork {

  public static final String IGNORE_INTERCEPTORS_HEADER = "exponentignoreinterceptors";

  private static final String CACHE_DIR = "okhttp";
  private static final int ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

  private Context mContext;
  private ExponentHttpClient mClient;
  private ExponentHttpClient mLongTimeoutClient;
  private Cache mCache;

  // This fixes OkHttp bug where if you don't read a response, it'll never cache that request in the future
  public static void flushResponse(Response response) throws IOException {
    response.body().bytes();
  }

  @Inject
  public ExponentNetwork(Context context) {
    mContext = context.getApplicationContext();

    int cacheSize = 40 * 1024 * 1024; // 40 MiB

    // Use getFilesDir() because it gives us much more space than getCacheDir()
    final File directory = new File(context.getFilesDir(), CACHE_DIR);
    mCache = new Cache(directory, cacheSize);

    mClient = new ExponentHttpClient(mContext, createHttpClientBuilder().build());

    OkHttpClient longTimeoutHttpClient = createHttpClientBuilder()
        .readTimeout(3, TimeUnit.MINUTES)
        .writeTimeout(1, TimeUnit.MINUTES)
        .build();
    mLongTimeoutClient = new ExponentHttpClient(mContext, longTimeoutHttpClient);
  }

  private OkHttpClient.Builder createHttpClientBuilder() {
    OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder()
        .cache(mCache);
    if (BuildConfig.DEBUG) {
      clientBuilder.addNetworkInterceptor(new StethoInterceptor());
    }
    addOfflineInterceptors(clientBuilder);

    return clientBuilder;
  }

  public ExponentHttpClient getClient() {
    return mClient;
  }

  public ExponentHttpClient getLongTimeoutClient() {
    return mLongTimeoutClient;
  }

  public Cache getCache() {
    return mCache;
  }

  public boolean isNetworkAvailable() {
    return isNetworkAvailable(mContext);
  }

  public static boolean isNetworkAvailable(final Context context) {
    ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
    NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
    return activeNetworkInfo != null && activeNetworkInfo.isConnected();
  }

  public void addOfflineInterceptors(OkHttpClient.Builder clientBuilder) {
    Interceptor interceptor = new Interceptor() {
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

    clientBuilder.addInterceptor(interceptor);
    clientBuilder.addNetworkInterceptor(interceptor);
  }

  private static Response noopInterceptor(Interceptor.Chain chain, Request originalRequest) throws IOException {
    Request request = originalRequest.newBuilder().removeHeader(IGNORE_INTERCEPTORS_HEADER).build();
    return chain.proceed(request);
  }
}
