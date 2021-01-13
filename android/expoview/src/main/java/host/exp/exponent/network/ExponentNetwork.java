// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.network;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;

import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

import javax.inject.Inject;
import javax.inject.Singleton;

import okhttp3.Cache;
import okhttp3.OkHttpClient;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.expoview.ExpoViewBuildConfig;

@Singleton
public class ExponentNetwork {

  private static final String TAG = ExponentNetwork.class.getSimpleName();

  public static final String IGNORE_INTERCEPTORS_HEADER = "exponentignoreinterceptors";

  private static final String CACHE_DIR = "http-cache";
  private static final String LEGACY_CACHE_DIR = "okhttp";

  private Context mContext;
  private ExponentSharedPreferences mExponentSharedPreferences;
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
    mExponentSharedPreferences = exponentSharedPreferences;

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

    clearLegacyCache();
  }

  private OkHttpClient.Builder createHttpClientBuilder() {
    OkHttpClient.Builder clientBuilder = new OkHttpClient.Builder()
        .cache(getCache());
    if (ExpoViewBuildConfig.DEBUG) {
      // FIXME: 8/9/17
      // clientBuilder.addNetworkInterceptor(new StethoInterceptor());
    }

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
    int cacheSize = 50 * 1024 * 1024; // 50 MiB
    final File directory = new File(mContext.getCacheDir(), CACHE_DIR);
    return new Cache(directory, cacheSize);
  }

  // TODO: can remove this after most apps have upgraded to SDK 41 or later
  private void clearLegacyCache() {
    if (mExponentSharedPreferences.getInteger(ExponentSharedPreferences.OKHTTP_CACHE_VERSION_KEY) == 1) {
      return;
    }

    try {
      File directory = new File(mContext.getFilesDir(), LEGACY_CACHE_DIR);
      Cache legacyCache = new Cache(directory, 40 * 1024 * 1024);
      legacyCache.delete();
      if (directory.exists()) {
        directory.delete();
      }
      mExponentSharedPreferences.setInteger(ExponentSharedPreferences.OKHTTP_CACHE_VERSION_KEY, 1);
    } catch (Exception e) {
      Log.e(TAG, "Failed to clear legacy OkHttp cache", e);
    }
  }

  public boolean isNetworkAvailable() {
    return isNetworkAvailable(mContext);
  }

  public static boolean isNetworkAvailable(final Context context) {
    ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
    NetworkInfo activeNetworkInfo = connectivityManager.getActiveNetworkInfo();
    return activeNetworkInfo != null && activeNetworkInfo.isConnected();
  }
}
