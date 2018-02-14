// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Debug;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.util.LruCache;

import com.amplitude.api.Amplitude;

import expolib_v1.okhttp3.CacheControl;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.exceptions.ManifestException;
import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentDB;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.ColorParser;
import host.exp.expoview.Exponent;
import host.exp.expoview.R;
import expolib_v1.okhttp3.Call;
import expolib_v1.okhttp3.Callback;
import expolib_v1.okhttp3.Headers;
import expolib_v1.okhttp3.Request;
import expolib_v1.okhttp3.Response;

import org.apache.commons.io.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;
import javax.inject.Singleton;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

@Singleton
public class ExponentManifest {

  public interface ManifestListener {
    void onCompleted(JSONObject manifest);
    void onError(Exception e);
    void onError(String e);
  }

  public interface BitmapListener {
    void onLoadBitmap(Bitmap bitmap);
  }

  private static final String TAG = ExponentManifest.class.getSimpleName();

  public static final String MANIFEST_STRING_KEY = "manifestString";
  public static final String MANIFEST_SIGNATURE_KEY = "signature";

  public static final String MANIFEST_ID_KEY = "id";
  public static final String MANIFEST_NAME_KEY = "name";
  public static final String MANIFEST_APP_KEY_KEY = "appKey";
  public static final String MANIFEST_SDK_VERSION_KEY = "sdkVersion";
  public static final String MANIFEST_IS_VERIFIED_KEY = "isVerified";
  public static final String MANIFEST_ICON_URL_KEY = "iconUrl";
  public static final String MANIFEST_PRIMARY_COLOR_KEY = "primaryColor";
  public static final String MANIFEST_ORIENTATION_KEY = "orientation";
  public static final String MANIFEST_DEVELOPER_KEY = "developer";
  public static final String MANIFEST_PACKAGER_OPTS_KEY = "packagerOpts";
  public static final String MANIFEST_PACKAGER_OPTS_DEV_KEY = "dev";
  public static final String MANIFEST_BUNDLE_URL_KEY = "bundleUrl";
  public static final String MANIFEST_SHOW_EXPONENT_NOTIFICATION_KEY = "androidShowExponentNotificationInShellApp";
  public static final String MANIFEST_REVISION_ID_KEY = "revisionId";
  public static final String MANIFEST_PUBLISHED_TIME_KEY = "publishedTime";
  public static final String MANIFEST_LOADED_FROM_CACHE_KEY = "loadedFromCache";

  // Statusbar
  public static final String MANIFEST_STATUS_BAR_KEY = "androidStatusBar";
  public static final String MANIFEST_STATUS_BAR_APPEARANCE = "barStyle";
  public static final String MANIFEST_STATUS_BAR_BACKGROUND_COLOR = "backgroundColor";
  @Deprecated
  public static final String MANIFEST_STATUS_BAR_COLOR = "androidStatusBarColor";

  // Notification
  public static final String MANIFEST_NOTIFICATION_INFO_KEY = "notification";
  public static final String MANIFEST_NOTIFICATION_ICON_URL_KEY = "iconUrl";
  public static final String MANIFEST_NOTIFICATION_COLOR_KEY = "color";
  public static final String MANIFEST_NOTIFICATION_ANDROID_MODE = "androidMode";
  public static final String MANIFEST_NOTIFICATION_ANDROID_COLLAPSED_TITLE = "androidCollapsedTitle";

  // Debugging
  public static final String MANIFEST_DEBUGGER_HOST_KEY = "debuggerHost";
  public static final String MANIFEST_MAIN_MODULE_NAME_KEY = "mainModuleName";

  // Loading
  public static final String MANIFEST_LOADING_INFO_KEY = "loading";
  public static final String MANIFEST_LOADING_ICON_URL = "iconUrl";
  public static final String MANIFEST_LOADING_EXPONENT_ICON_COLOR = "exponentIconColor";
  public static final String MANIFEST_LOADING_EXPONENT_ICON_GRAYSCALE = "exponentIconGrayscale";
  public static final String MANIFEST_LOADING_BACKGROUND_IMAGE_URL = "backgroundImageUrl";
  public static final String MANIFEST_LOADING_BACKGROUND_COLOR = "backgroundColor";
  public static final String MANIFEST_LOADING_HIDE_EXPONENT_TEXT_KEY = "hideExponentText";

  // Splash
  public static final String MANIFEST_SPLASH_INFO_KEY = "splash";
  public static final String MANIFEST_SPLASH_IMAGE_URL = "imageUrl";
  public static final String MANIFEST_SPLASH_RESIZE_MODE = "resizeMode";
  public static final String MANIFEST_SPLASH_BACKGROUND_COLOR = "backgroundColor";

  // Updates
  public static final String MANIFEST_UPDATES_INFO_KEY = "updates";
  public static final String MANIFEST_UPDATES_TIMEOUT_KEY = "fallbackToCacheTimeout";
  public static final String MANIFEST_UPDATES_CHECK_AUTOMATICALLY_KEY = "checkAutomatically";
  public static final String MANIFEST_UPDATES_CHECK_AUTOMATICALLY_LAUNCH = "launch";
  public static final String MANIFEST_UPDATES_CHECK_AUTOMATICALLY_NEVER = "never";

  private static final int MAX_BITMAP_SIZE = 192;
  private static final String REDIRECT_SNIPPET = "exp.host/--/to-exp/";
  private static final String ANONYMOUS_EXPERIENCE_PREFIX = "@anonymous/";
  private static final String EMBEDDED_KERNEL_MANIFEST_ASSET = "kernel-manifest.json";
  private static final String EXPONENT_SERVER_HEADER = "Exponent-Server";

  private static boolean hasShownKernelManifestLog = false;

  Context mContext;
  ExponentNetwork mExponentNetwork;
  Crypto mCrypto;
  private LruCache<String, Bitmap> mMemoryCache;
  ExponentSharedPreferences mExponentSharedPreferences;

  @Inject
  public ExponentManifest(Context context, ExponentNetwork exponentNetwork, Crypto crypto, ExponentSharedPreferences exponentSharedPreferences) {
    mContext = context;
    mExponentNetwork = exponentNetwork;
    mCrypto = crypto;
    mExponentSharedPreferences = exponentSharedPreferences;

    int maxMemory = (int) (Runtime.getRuntime().maxMemory() / 1024);
    // Use 1/16th of the available memory for this memory cache.
    final int cacheSize = maxMemory / 16;
    mMemoryCache = new LruCache<String, Bitmap>(cacheSize) {
      @Override
      protected int sizeOf(String key, Bitmap bitmap) {
        return bitmap.getByteCount() / 1024;
      }
    };
  }

  public void fetchManifest(final String manifestUrl, final ManifestListener listener) {
    fetchManifest(manifestUrl, listener, false);
  }

  public void fetchManifest(final String manifestUrl, final ManifestListener listener, final boolean forceNetwork) {
    Analytics.markEvent(Analytics.TimedEvent.STARTED_FETCHING_MANIFEST);

    String realManifestUrl = manifestUrl;
    if (manifestUrl.contains(REDIRECT_SNIPPET)) {
      // Redirect urls look like "https://exp.host/--/to-exp/exp%3A%2F%2Fgj-5x6.jesse.internal.exp.direct%3A80".
      // Android is crazy and catches this url with this intent filter:
      //  <data
      //    android:host="*.exp.direct"
      //    android:pathPattern=".*"
      //    android:scheme="http"/>
      //  <data
      //    android:host="*.exp.direct"
      //    android:pathPattern=".*"
      //    android:scheme="https"/>
      // so we have to add some special logic to handle that. This is than handling arbitrary HTTP 301s and 302
      // because we need to add /index.exp to the paths.
      realManifestUrl = Uri.decode(realManifestUrl.substring(realManifestUrl.indexOf(REDIRECT_SNIPPET) + REDIRECT_SNIPPET.length()));
    }

    String httpManifestUrl = ExponentUrls.toHttp(realManifestUrl);

    // Append index.exp to path
    Uri uri = Uri.parse(httpManifestUrl);
    String newPath = uri.getPath();
    if (newPath == null) {
      newPath = "";
    }
    if (!newPath.endsWith("/")) {
      newPath += "/";
    }
    newPath += "index.exp";
    httpManifestUrl = uri.buildUpon().encodedPath(newPath).build().toString();

    // Fetch manifest
    Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToUrl(httpManifestUrl, manifestUrl.equals(Constants.INITIAL_URL), false);
    requestBuilder.header("Exponent-Accept-Signature", "true");
    requestBuilder.header("Expo-JSON-Error", "true");

    Analytics.markEvent(Analytics.TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST);
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.startMethodTracing("manifest");
    }

    boolean isDevelopment = false;
    if (uri.getHost().equals("localhost") || uri.getHost().endsWith(".exp.direct")) {
      isDevelopment = true;
    }

    if (isDevelopment || forceNetwork) {
      requestBuilder.cacheControl(CacheControl.FORCE_NETWORK);
      // If we're sure this is a development url, don't cache. Note that LAN development urls
      // might still be cached
      mExponentNetwork.getClient().callSafe(requestBuilder.build(), new ExponentHttpClient.SafeCallback() {
        private void handleResponse(Response response, boolean isCached) {
          if (!response.isSuccessful()) {
            ManifestException exception;
            try {
              final JSONObject errorJSON = new JSONObject(response.body().string());
              exception = new ManifestException(null, manifestUrl, errorJSON);
            } catch (JSONException | IOException e) {
              exception = new ManifestException(null, manifestUrl);
            }
            listener.onError(exception);
            return;
          }

          try {
            String manifestString = response.body().string();
            fetchManifestStep2(manifestUrl, manifestString, response.headers(), listener, false, isCached);
          } catch (JSONException e) {
            listener.onError(e);
          } catch (IOException e) {
            listener.onError(e);
          }
        }

        @Override
        public void onFailure(Call call, IOException e) {
          listener.onError(new ManifestException(e, manifestUrl));
        }

        @Override
        public void onResponse(Call call, Response response) {
          // OkHttp sometimes decides to use the cache anyway here
          boolean isCached = false;
          if (response.networkResponse() == null) {
            isCached = true;
          }
          handleResponse(response, isCached);
        }

        @Override
        public void onCachedResponse(Call call, Response response, boolean isEmbedded) {
          // this is only called if network is unavailable for some reason
          handleResponse(response, true);
        }
      });
    } else {
      final Request request = requestBuilder.build();
      final String finalUri = request.url().toString();
      mExponentNetwork.getClient().callDefaultCache(request, new ExponentHttpClient.SafeCallback() {

        private void handleResponse(ManifestListener listener, Response response, boolean isEmbedded, boolean isCached) {
          if (!response.isSuccessful()) {
            listener.onError(new ManifestException(null, manifestUrl));
            return;
          }

          try {
            String manifestString = response.body().string();
            fetchManifestStep2(manifestUrl, manifestString, response.headers(), listener, isEmbedded, isCached);
          } catch (JSONException e) {
            listener.onError(e);
          } catch (IOException e) {
            listener.onError(e);
          }
        }

        @Override
        public void onFailure(Call call, IOException e) {
          listener.onError(new ManifestException(e, manifestUrl));
        }

        @Override
        public void onResponse(Call call, Response response) {
          // OkHttp sometimes decides to use the cache anyway here
          boolean isCached = false;
          if (response.networkResponse() == null) {
            isCached = true;
          }
          handleResponse(listener, response, false, isCached);
        }

        @Override
        public void onCachedResponse(Call call, Response response, boolean isEmbedded) {
          EXL.d(TAG, "Using cached or embedded response.");

          ManifestListener newListener = listener;

          if (!isEmbedded) {
            final String embeddedResponse = mExponentNetwork.getClient().getHardCodedResponse(finalUri);
            if (embeddedResponse != null) {
              // use newer of two responses
              newListener = new ManifestListener() {
                @Override
                public void onCompleted(JSONObject manifest) {
                  try {
                    JSONObject embeddedManifest = new JSONObject(embeddedResponse);
                    embeddedManifest.put("loadedFromCache", true);

                    String cachedManifestTimestamp = manifest.getString(MANIFEST_PUBLISHED_TIME_KEY);
                    String embeddedManifestTimestamp = embeddedManifest.getString(MANIFEST_PUBLISHED_TIME_KEY);

                    DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX");
                    Date cachedManifestDate = formatter.parse(cachedManifestTimestamp);
                    Date embeddedManifestDate = formatter.parse(embeddedManifestTimestamp);

                    if (embeddedManifestDate.after(cachedManifestDate)) {
                      fetchManifestStep3(manifestUrl, embeddedManifest, true, listener);
                    } else {
                      listener.onCompleted(manifest);
                    }
                  } catch (Throwable e) {
                    listener.onCompleted(manifest);
                  }
                }

                @Override
                public void onError(Exception e) {
                  listener.onError(e);
                }

                @Override
                public void onError(String e) {
                  listener.onError(e);
                }
              };
            }
          }

          final ManifestListener finalManifestListener = newListener;
          handleResponse(new ManifestListener() {
            @Override
            public void onCompleted(JSONObject manifest) {
              finalManifestListener.onCompleted(manifest);
              AsyncTask.execute(new Runnable() {
                @Override
                public void run() {
                  Exponent.getInstance().preloadManifestAndBundle(manifestUrl);
                }
              });
            }

            @Override
            public void onError(Exception e) {
              finalManifestListener.onError(e);
            }

            @Override
            public void onError(String e) {
              finalManifestListener.onError(e);
            }
          }, response, isEmbedded, true);
        }
      });
    }
  }

  public boolean fetchCachedManifest(final String manifestUrl, final ManifestListener listener) {
//    Analytics.markEvent(Analytics.TimedEvent.STARTED_FETCHING_MANIFEST);

    String realManifestUrl = manifestUrl;
    if (manifestUrl.contains(REDIRECT_SNIPPET)) {
      // Redirect urls look like "https://exp.host/--/to-exp/exp%3A%2F%2Fgj-5x6.jesse.internal.exp.direct%3A80".
      // Android is crazy and catches this url with this intent filter:
      //  <data
      //    android:host="*.exp.direct"
      //    android:pathPattern=".*"
      //    android:scheme="http"/>
      //  <data
      //    android:host="*.exp.direct"
      //    android:pathPattern=".*"
      //    android:scheme="https"/>
      // so we have to add some special logic to handle that. This is than handling arbitrary HTTP 301s and 302
      // because we need to add /index.exp to the paths.
      realManifestUrl = Uri.decode(realManifestUrl.substring(realManifestUrl.indexOf(REDIRECT_SNIPPET) + REDIRECT_SNIPPET.length()));
    }

    String httpManifestUrl = ExponentUrls.toHttp(realManifestUrl);

    // Append index.exp to path
    Uri uri = Uri.parse(httpManifestUrl);
    String newPath = uri.getPath();
    if (newPath == null) {
      newPath = "";
    }
    if (!newPath.endsWith("/")) {
      newPath += "/";
    }
    newPath += "index.exp";
    httpManifestUrl = uri.buildUpon().encodedPath(newPath).build().toString();

    if (uri.getHost().equals("localhost") || uri.getHost().endsWith(".exp.direct")) {
      // if we're in development mode, we don't ever want to fetch a cached manifest
      return false;
    }

    // Fetch manifest
    Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToUrl(httpManifestUrl, manifestUrl.equals(Constants.INITIAL_URL), false);
    requestBuilder.header("Exponent-Accept-Signature", "true");
    requestBuilder.header("Expo-JSON-Error", "true");

//    Analytics.markEvent(Analytics.TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST);
//    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
//      Debug.startMethodTracing("manifest");
//    }

    Request request = requestBuilder.build();

    mExponentNetwork.getClient().tryForcedCachedResponse(request.url().toString(), request, new ExponentHttpClient.SafeCallback() {
      @Override
      public void onFailure(Call call, IOException e) {

        listener.onError(new ManifestException(e, manifestUrl));
      }

      @Override
      public void onResponse(Call call, Response response) {
        if (!response.isSuccessful()) {
          ManifestException exception;
          try {
            final JSONObject errorJSON = new JSONObject(response.body().string());
            exception = new ManifestException(null, manifestUrl, errorJSON);
          } catch (JSONException | IOException e) {
            exception = new ManifestException(null, manifestUrl);
          }
          listener.onError(exception);
          return;
        }

        try {
          String manifestString = response.body().string();
          fetchManifestStep2(manifestUrl, manifestString, response.headers(), listener, false, true);
        } catch (JSONException e) {
          listener.onError(e);
        } catch (IOException e) {
          listener.onError(e);
        }
      }

      @Override
      public void onCachedResponse(Call call, Response response, boolean isEmbedded) {
        onResponse(call, response);
      }
    }, null, null);

    return true;
  }

  private void fetchManifestStep2(final String manifestUrl, final String manifestString, final Headers headers, final ManifestListener listener, final boolean isEmbedded, boolean isCached) throws JSONException {
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.stopMethodTracing();
    }
    Analytics.markEvent(Analytics.TimedEvent.FINISHED_MANIFEST_NETWORK_REQUEST);

    final JSONObject manifest = new JSONObject(manifestString);
    final boolean isMainShellAppExperience = manifestUrl.equals(Constants.INITIAL_URL);

    if (manifest.has(MANIFEST_STRING_KEY) && manifest.has(MANIFEST_SIGNATURE_KEY)) {
      final JSONObject innerManifest = new JSONObject(manifest.getString(MANIFEST_STRING_KEY));
      innerManifest.put(MANIFEST_LOADED_FROM_CACHE_KEY, isCached);

      final boolean isOffline = !ExponentNetwork.isNetworkAvailable(mContext);

      if (isAnonymousExperience(innerManifest) || isMainShellAppExperience) {
        // Automatically verified.
        fetchManifestStep3(manifestUrl, innerManifest, true, listener);
      } else {
        mCrypto.verifyPublicRSASignature(Constants.API_HOST + "/--/manifest-public-key",
            manifest.getString(MANIFEST_STRING_KEY), manifest.getString(MANIFEST_SIGNATURE_KEY), new Crypto.RSASignatureListener() {
              @Override
              public void onError(String errorMessage, boolean isNetworkError) {
                if (isOffline && isNetworkError) {
                  // automatically validate if offline and don't have public key
                  // TODO: we need to evict manifest from the cache if it doesn't pass validation when online
                  fetchManifestStep3(manifestUrl, innerManifest, true, listener);
                } else {
                  Log.w(TAG, errorMessage);
                  fetchManifestStep3(manifestUrl, innerManifest, false, listener);
                }
              }

              @Override
              public void onCompleted(boolean isValid) {
                fetchManifestStep3(manifestUrl, innerManifest, isValid, listener);
              }
            });
      }
    } else {
      if (isEmbedded || isMainShellAppExperience) {
        fetchManifestStep3(manifestUrl, manifest, true, listener);
      } else {
        fetchManifestStep3(manifestUrl, manifest, false, listener);
      }
    }

    final String exponentServerHeader = headers.get(EXPONENT_SERVER_HEADER);
    if (exponentServerHeader != null) {
      try {
        JSONObject eventProperties = new JSONObject(exponentServerHeader);
        Amplitude.getInstance().logEvent(Analytics.LOAD_DEVELOPER_MANIFEST, eventProperties);
      } catch (Throwable e) {
        EXL.e(TAG, e);
      }
    }
  }

  private void fetchManifestStep3(final String manifestUrl, final JSONObject manifest, final boolean isVerified, final ManifestListener listener) {
    String bundleUrl;

    if (!manifest.has(MANIFEST_BUNDLE_URL_KEY)) {
      listener.onError("No bundleUrl in manifest");
      return;
    }

    try {
      manifest.put(MANIFEST_IS_VERIFIED_KEY, isVerified);
    } catch (JSONException e) {
      listener.onError(e);
      return;
    }

    listener.onCompleted(manifest);
  }

  public JSONObject normalizeManifest(final String manifestUrl, final JSONObject manifest) throws JSONException {
    if (!manifest.has(MANIFEST_ID_KEY)) {
      manifest.put(MANIFEST_ID_KEY, manifestUrl);
    }

    if (!manifest.has(MANIFEST_NAME_KEY)) {
      manifest.put(MANIFEST_NAME_KEY, "My New Experience");
    }

    if (!manifest.has(MANIFEST_PRIMARY_COLOR_KEY)) {
      manifest.put(MANIFEST_PRIMARY_COLOR_KEY, "#023C69");
    }

    if (!manifest.has(MANIFEST_ICON_URL_KEY)) {
      manifest.put(MANIFEST_ICON_URL_KEY, "https://d3lwq5rlu14cro.cloudfront.net/ExponentEmptyManifest_192.png");
    }

    if (!manifest.has(MANIFEST_ORIENTATION_KEY)) {
      manifest.put(MANIFEST_ORIENTATION_KEY, "default");
    }

    return manifest;
  }

  public void loadIconBitmap(final String iconUrl, final BitmapListener listener) {
    if (iconUrl != null && !iconUrl.isEmpty()) {
      Bitmap cachedBitmap = mMemoryCache.get(iconUrl);
      if (cachedBitmap != null) {
        listener.onLoadBitmap(cachedBitmap);
        return;
      }

      new AsyncTask<Void, Void, Bitmap>() {

        @Override
        protected Bitmap doInBackground(Void... params) {
          try {
            // TODO: inject shared OkHttp client
            URL url = new URL(iconUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setDoInput(true);
            connection.connect();
            InputStream input = connection.getInputStream();

            Bitmap bitmap = BitmapFactory.decodeStream(input);
            int width = bitmap.getWidth();
            int height = bitmap.getHeight();
            if (width <= MAX_BITMAP_SIZE && height <= MAX_BITMAP_SIZE) {
              mMemoryCache.put(iconUrl, bitmap);
              return bitmap;
            }

            int maxDimension = Math.max(width, height);
            float scaledWidth = (((float) width) * MAX_BITMAP_SIZE) / maxDimension;
            float scaledHeight = (((float) height) * MAX_BITMAP_SIZE) / maxDimension;
            Bitmap scaledBitmap = Bitmap.createScaledBitmap(bitmap, (int) scaledWidth, (int) scaledHeight, true);
            mMemoryCache.put(iconUrl, scaledBitmap);
            return scaledBitmap;
          } catch (IOException e) {
            EXL.e(TAG, e);
            return BitmapFactory.decodeResource(mContext.getResources(), R.mipmap.ic_launcher);
          } catch (Throwable e) {
            EXL.e(TAG, e);
            return BitmapFactory.decodeResource(mContext.getResources(), R.mipmap.ic_launcher);
          }
        }

        @Override
        protected void onPostExecute(Bitmap result) {
          listener.onLoadBitmap(result);
        }
      }.execute();
    } else {
      Bitmap bitmap = BitmapFactory.decodeResource(mContext.getResources(), R.mipmap.ic_launcher);
      listener.onLoadBitmap(bitmap);
    }
  }

  public int getColorFromManifest(final JSONObject manifest) {
    String colorString = manifest.optString(MANIFEST_PRIMARY_COLOR_KEY);
    if (colorString != null && ColorParser.isValid(colorString)) {
      return Color.parseColor(colorString);
    } else {
      return R.color.colorPrimary;
    }
  }

  private boolean isAnonymousExperience(final JSONObject manifest) {
    if (manifest.has(MANIFEST_ID_KEY)) {
      final String id = manifest.optString(MANIFEST_ID_KEY);
      if (id != null && id.startsWith(ANONYMOUS_EXPERIENCE_PREFIX)) {
        return true;
      }
    }

    return false;
  }

  private JSONObject getLocalKernelManifest() {
    try {
      JSONObject manifest = new JSONObject(ExponentBuildConstants.BUILD_MACHINE_KERNEL_MANIFEST);
      manifest.put(MANIFEST_IS_VERIFIED_KEY, true);
      return manifest;
    } catch (JSONException e) {
      throw new RuntimeException("Can't get local manifest: " + e.toString());
    }
  }

  private JSONObject getRemoteKernelManifest() {
    try {
      InputStream inputStream = mContext.getAssets().open(EMBEDDED_KERNEL_MANIFEST_ASSET);
      String jsonString = IOUtils.toString(inputStream);
      JSONObject manifest = new JSONObject(jsonString);
      manifest.put(MANIFEST_IS_VERIFIED_KEY, true);
      return manifest;
    } catch (Exception e) {
      KernelProvider.getInstance().handleError(e);
      return null;
    }
  }

  public JSONObject getKernelManifest() {
    JSONObject manifest;
    String log;
    if (mExponentSharedPreferences.shouldUseInternetKernel()) {
      log = "Using remote Expo kernel manifest";
      manifest = getRemoteKernelManifest();
    } else {
      log = "Using local Expo kernel manifest";
      manifest = getLocalKernelManifest();
    }

    if (!hasShownKernelManifestLog) {
      hasShownKernelManifestLog = true;
      EXL.d(TAG, log + ": " + manifest.toString());
    }

    return manifest;
  }

  public String getKernelManifestField(final String fieldName) {
    try {
      return getKernelManifest().getString(fieldName);
    } catch (JSONException e) {
      KernelProvider.getInstance().handleError(e);
      return null;
    }
  }

  public static boolean isDebugModeEnabled(final JSONObject manifest) {
    try {
      return (manifest != null &&
          manifest.has(ExponentManifest.MANIFEST_DEVELOPER_KEY) &&
          manifest.has(ExponentManifest.MANIFEST_PACKAGER_OPTS_KEY) &&
          manifest.getJSONObject(ExponentManifest.MANIFEST_PACKAGER_OPTS_KEY)
              .optBoolean(ExponentManifest.MANIFEST_PACKAGER_OPTS_DEV_KEY, false));
    } catch (JSONException e) {
      return false;
    }
  }
}
