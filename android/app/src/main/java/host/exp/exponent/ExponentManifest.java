// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Debug;
import android.util.Log;
import android.util.LruCache;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import javax.inject.Inject;
import javax.inject.Singleton;

import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.exceptions.ManifestException;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.utils.ColorParser;
import okhttp3.Call;
import okhttp3.Request;
import okhttp3.Response;

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
  public static final String MANIFEST_STATUS_BAR_COLOR = "androidStatusBarColor";
  public static final String MANIFEST_HIDE_EXPONENT_NOTIFICATION_KEY = "androidHideExponentNotificationInShellApp";

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

  private static final int MAX_BITMAP_SIZE = 192;
  private static final String REDIRECT_SNIPPET = "exp.host/--/to-exp/";

  Context mContext;
  ExponentNetwork mExponentNetwork;
  Crypto mCrypto;
  private LruCache<String, Bitmap> mMemoryCache;

  @Inject
  public ExponentManifest(Context context, ExponentNetwork exponentNetwork, Crypto crypto) {
    mContext = context;
    mExponentNetwork = exponentNetwork;
    mCrypto = crypto;

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

  public static boolean booleanValue(final JSONObject manifest, final String propertyKey, final boolean defaultValue) {
    String value = manifest.optString(propertyKey);
    if (value == null) {
      return defaultValue;
    } else if (value.toLowerCase().equals("true")) {
      return true;
    } else if (value.toLowerCase().equals("false")) {
      return false;
    } else {
      return defaultValue;
    }
  }

  public void fetchManifest(final String manifestUrl, final ManifestListener listener) {
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
    final boolean isSecureDomain = httpManifestUrl.startsWith(Constants.API_HOST);

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
    final boolean shouldRequestSignedManifest = !isSecureDomain;
    Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToUrl(httpManifestUrl);
    if (shouldRequestSignedManifest) {
      requestBuilder.header("Exponent-Accept-Signature", "true");
    }

    Analytics.markEvent(Analytics.TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST);
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.startMethodTracing("manifest");
    }
    mExponentNetwork.getClient().callSafe(requestBuilder.build(), new ExponentHttpClient.SafeCallback() {
      @Override
      public void onFailure(Call call, IOException e) {
        listener.onError(new ManifestException(e, manifestUrl));
      }

      @Override
      public void onResponse(Call call, Response response) {
        if (!response.isSuccessful()) {
          listener.onError(new ManifestException(null, manifestUrl));
          return;
        }

        if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
          Debug.stopMethodTracing();
        }
        Analytics.markEvent(Analytics.TimedEvent.FINISHED_MANIFEST_NETWORK_REQUEST);
        try {
          String manifestString = response.body().string();
          fetchManifestStep2(manifestString, isSecureDomain, shouldRequestSignedManifest, listener);
        } catch (JSONException e) {
          listener.onError(e);
        } catch (IOException e) {
          listener.onError(e);
        }
      }

      @Override
      public void onErrorCacheResponse(Call call, Response response) {
        EXL.d(TAG, "Initial HTTP request failed. Using cached or embedded response.");
        onResponse(call, response);
      }
    });
  }

  private void fetchManifestStep2(final String manifestString, final boolean isSecureDomain,
                                  final boolean shouldRequestSignedManifest, final ManifestListener listener) throws JSONException {
    final JSONObject manifest = new JSONObject(manifestString);
    final boolean isVerified = isSecureDomain;
    if (shouldRequestSignedManifest && manifest.has("manifestString") && manifest.has("signature")) {
      final JSONObject innerManifest = new JSONObject(manifest.getString("manifestString"));
      mCrypto.verifyPublicRSASignature(Constants.API_HOST + "/--/manifest-public-key",
          manifest.getString("manifestString"), manifest.getString("signature"), new Crypto.RSASignatureListener() {
        @Override
        public void onError(String errorMessage) {
          Log.w(TAG, errorMessage);
          fetchManifestStep3(innerManifest, isVerified, listener);
        }

        @Override
        public void onCompleted(boolean isValid) {
          fetchManifestStep3(innerManifest, isValid, listener);
        }
      });
    } else {
      fetchManifestStep3(manifest, isVerified, listener);
    }
  }

  private void fetchManifestStep3(final JSONObject manifest, final boolean isVerified, final ManifestListener listener) {
    try {
      manifest.put("isVerified", isVerified);
    } catch (JSONException e) {
      listener.onError(e);
    }

    if (!manifest.has("bundleUrl")) {
      listener.onError("No bundleUrl in manifest");
    }

    EXL.d(TAG, "Done fetching manifest");
    Analytics.markEvent(Analytics.TimedEvent.FINISHED_FETCHING_MANIFEST);
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
          } catch (RuntimeException e) {
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
}
