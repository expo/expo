// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Debug;
import android.text.TextUtils;
import android.util.Log;
import android.util.LruCache;

import androidx.annotation.Nullable;
import androidx.annotation.WorkerThread;

import expo.modules.updates.manifest.ManifestFactory;
import expo.modules.updates.manifest.raw.RawManifest;
import okhttp3.CacheControl;
import host.exp.exponent.analytics.Analytics;
import host.exp.exponent.analytics.EXL;
import host.exp.exponent.exceptions.ManifestException;
import host.exp.exponent.generated.ExponentBuildConstants;
import host.exp.exponent.kernel.Crypto;
import host.exp.exponent.kernel.ExponentUrls;
import host.exp.exponent.kernel.KernelProvider;
import host.exp.exponent.network.ExpoHeaders;
import host.exp.exponent.network.ExpoResponse;
import host.exp.exponent.network.ExponentHttpClient;
import host.exp.exponent.network.ExponentNetwork;
import host.exp.exponent.storage.ExponentSharedPreferences;
import host.exp.exponent.utils.ColorParser;
import host.exp.expoview.R;
import okhttp3.Request;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import javax.inject.Inject;
import javax.inject.Singleton;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URI;
import java.net.URISyntaxException;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@Singleton
public class ExponentManifest {

  public interface ManifestListener {
    void onCompleted(RawManifest manifest);
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
  public static final String MANIFEST_BACKGROUND_COLOR_KEY = "backgroundColor";
  public static final String MANIFEST_PRIMARY_COLOR_KEY = "primaryColor";
  public static final String MANIFEST_ORIENTATION_KEY = "orientation";
  public static final String MANIFEST_DEVELOPER_KEY = "developer";
  public static final String MANIFEST_DEVELOPER_TOOL_KEY = "tool";
  public static final String MANIFEST_PACKAGER_OPTS_KEY = "packagerOpts";
  public static final String MANIFEST_PACKAGER_OPTS_DEV_KEY = "dev";
  public static final String MANIFEST_BUNDLE_URL_KEY = "bundleUrl";
  public static final String MANIFEST_REVISION_ID_KEY = "revisionId";
  public static final String MANIFEST_PUBLISHED_TIME_KEY = "publishedTime";
  public static final String MANIFEST_COMMIT_TIME_KEY = "commitTime";
  public static final String MANIFEST_LOADED_FROM_CACHE_KEY = "loadedFromCache";
  public static final String MANIFEST_SLUG = "slug";
  public static final String MANIFEST_ANDROID_INFO_KEY = "android";
  public static final String MANIFEST_KEYBOARD_LAYOUT_MODE_KEY = "softwareKeyboardLayoutMode";

  // Statusbar
  public static final String MANIFEST_STATUS_BAR_KEY = "androidStatusBar";
  public static final String MANIFEST_STATUS_BAR_APPEARANCE = "barStyle";
  public static final String MANIFEST_STATUS_BAR_BACKGROUND_COLOR = "backgroundColor";
  public static final String MANIFEST_STATUS_BAR_HIDDEN = "hidden";
  public static final String MANIFEST_STATUS_BAR_TRANSLUCENT = "translucent";

  // NavigationBar
  public static final String MANIFEST_NAVIGATION_BAR_KEY = "androidNavigationBar";
  public static final String MANIFEST_NAVIGATION_BAR_VISIBLILITY = "visible";
  public static final String MANIFEST_NAVIGATION_BAR_APPEARANCE = "barStyle";
  public static final String MANIFEST_NAVIGATION_BAR_BACKGROUND_COLOR = "backgroundColor";

  // Notification
  public static final String MANIFEST_NOTIFICATION_INFO_KEY = "notification";
  public static final String MANIFEST_NOTIFICATION_ICON_URL_KEY = "iconUrl";
  public static final String MANIFEST_NOTIFICATION_COLOR_KEY = "color";
  public static final String MANIFEST_NOTIFICATION_ANDROID_MODE = "androidMode";
  public static final String MANIFEST_NOTIFICATION_ANDROID_COLLAPSED_TITLE = "androidCollapsedTitle";

  // Debugging
  public static final String MANIFEST_DEBUGGER_HOST_KEY = "debuggerHost";
  public static final String MANIFEST_MAIN_MODULE_NAME_KEY = "mainModuleName";

  // Splash
  public static final String MANIFEST_SPLASH_INFO_KEY = "splash";
  public static final String MANIFEST_SPLASH_IMAGE_URL_KEY = "imageUrl";
  public static final String MANIFEST_SPLASH_RESIZE_MODE_KEY = "resizeMode";
  public static final String MANIFEST_SPLASH_BACKGROUND_COLOR_KEY = "backgroundColor";

  // Updates
  public static final String MANIFEST_UPDATES_INFO_KEY = "updates";
  public static final String MANIFEST_UPDATES_TIMEOUT_KEY = "fallbackToCacheTimeout";
  public static final String MANIFEST_UPDATES_CHECK_AUTOMATICALLY_KEY = "checkAutomatically";
  public static final String MANIFEST_UPDATES_CHECK_AUTOMATICALLY_ON_LOAD = "ON_LOAD";
  public static final String MANIFEST_UPDATES_CHECK_AUTOMATICALLY_ON_ERROR = "ON_ERROR_RECOVERY";

  // Development client
  public static final String MANIFEST_DEVELOPMENT_CLIENT_KEY = "developmentClient";
  public static final String MANIFEST_DEVELOPMENT_CLIENT_SILENT_LAUNCH_KEY = "silentLaunch";

  public static final String DEEP_LINK_SEPARATOR = "--";
  public static final String DEEP_LINK_SEPARATOR_WITH_SLASH = "--/";
  public static final String QUERY_PARAM_KEY_RELEASE_CHANNEL = "release-channel";

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

  public Uri httpManifestUrl(String manifestUrl) {
    return httpManifestUrlBuilder(manifestUrl).build();
  }

  private Uri.Builder httpManifestUrlBuilder(String manifestUrl) {
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
      realManifestUrl = Uri.decode(realManifestUrl.substring(realManifestUrl.indexOf(REDIRECT_SNIPPET) + REDIRECT_SNIPPET.length()));
    }

    String httpManifestUrl = ExponentUrls.toHttp(realManifestUrl);

    Uri uri = Uri.parse(httpManifestUrl);
    String newPath = uri.getPath();
    if (newPath == null) {
      newPath = "";
    }
    int deepLinkIndex = newPath.indexOf(DEEP_LINK_SEPARATOR_WITH_SLASH);
    if (deepLinkIndex > -1) {
      newPath = newPath.substring(0, deepLinkIndex);
    }
    return uri.buildUpon().encodedPath(newPath);
  }

  public void fetchManifest(final String manifestUrl, final ManifestListener listener) {
    fetchManifest(manifestUrl, listener, true);
  }

  public void fetchManifest(final String manifestUrl, final ManifestListener listener, boolean shouldWriteToCache) {
    Analytics.markEvent(Analytics.TimedEvent.STARTED_FETCHING_MANIFEST);

    Uri.Builder uriBuilder = httpManifestUrlBuilder(manifestUrl);
    if (!shouldWriteToCache) {
      // add a dummy parameter so this doesn't overwrite the current cached manifest
      // more correct would be to add Cache-Control: no-store header, but this doesn't seem to
      // work correctly with requests in okhttp
      uriBuilder.appendQueryParameter("cache", "false");
    }
    String httpManifestUrl = uriBuilder.build().toString();

    // Fetch manifest
    Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToManifestUrl(
        httpManifestUrl,
        manifestUrl.equals(Constants.INITIAL_URL),
        mExponentSharedPreferences.getSessionSecret()
    );
    requestBuilder.header("Exponent-Accept-Signature", "true");
    requestBuilder.header("Expo-JSON-Error", "true");
    requestBuilder.cacheControl(CacheControl.FORCE_NETWORK);

    Analytics.markEvent(Analytics.TimedEvent.STARTED_MANIFEST_NETWORK_REQUEST);
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.startMethodTracing("manifest");
    }

    Request request = requestBuilder.build();
    final String finalUri = request.url().toString();

    mExponentNetwork.getClient().callSafe(request, new ExponentHttpClient.SafeCallback() {
      @Override
      public void onFailure(IOException e) {
        listener.onError(new ManifestException(e, manifestUrl));
      }

      @Override
      public void onResponse(ExpoResponse response) {
        // OkHttp sometimes decides to use the cache anyway here
        boolean isCached = false;
        if (response.networkResponse() == null) {
          isCached = true;
        }
        handleManifestResponse(response, manifestUrl, finalUri, listener, false, isCached);
      }

      @Override
      public void onCachedResponse(ExpoResponse response, boolean isEmbedded) {
        // this is only called if network is unavailable for some reason
        handleManifestResponse(response, manifestUrl, finalUri, listener, isEmbedded, true);
      }
    });
  }

  // Returns false if manifestUrl should not be cached. May call listener.onError.
  // Otherwise, returns true and calls one of the callbacks on listener.
  public boolean fetchCachedManifest(final String manifestUrl, final ManifestListener listener) {
    Uri uri = httpManifestUrlBuilder(manifestUrl).build();
    String httpManifestUrl = uri.toString();

    if (uri.getHost() == null) {
      String message = "Could not load manifest.";
      if (Constants.isStandaloneApp()) {
        message += " Are you sure this experience has been published?";
      } else {
        message += " Are you sure this is a valid URL?";
      }
      listener.onError(message);
    }

    if (uri.getHost().equals("localhost") || uri.getHost().endsWith(".exp.direct")) {
      // if we're in development mode, we don't ever want to fetch a cached manifest
      return false;
    }

    // Fetch manifest
    Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToManifestUrl(
        httpManifestUrl,
        manifestUrl.equals(Constants.INITIAL_URL),
        mExponentSharedPreferences.getSessionSecret()
    );
    requestBuilder.header("Exponent-Accept-Signature", "true");
    requestBuilder.header("Expo-JSON-Error", "true");

    Request request = requestBuilder.build();
    final String finalUri = request.url().toString();

    // First check shared preferences cache, we always store the latest version here
    // that has a fully downloaded bundle
    String safeCachedManifest = mExponentSharedPreferences.getSafeManifestString(manifestUrl);
    if (safeCachedManifest != null) {
      try {
        // we return early here because we want to call the below logic (checking the OkHttp cache)
        // iff this throws (or safeCachedManifest is null)
        fetchManifestStep2(manifestUrl, finalUri, safeCachedManifest, null, listener, false, true);
        return true;
      } catch (Exception e) {
        EXL.e(TAG, e);
      }
    }

    // If nothing is in shared preferences, we need to query the OkHttp cache
    mExponentNetwork.getClient().tryForcedCachedResponse(finalUri, request, new ExponentHttpClient.SafeCallback() {
      @Override
      public void onFailure(IOException e) {
        listener.onError(new ManifestException(e, manifestUrl));
      }

      @Override
      public void onResponse(ExpoResponse response) {
        handleManifestResponse(response, manifestUrl, finalUri, listener, false, true);
      }

      @Override
      public void onCachedResponse(ExpoResponse response, boolean isEmbedded) {
        handleManifestResponse(response, manifestUrl, finalUri, listener, isEmbedded, true);
      }
    }, null, null);

    return true;
  }

  // this is used only if updates.enabled == false
  public void fetchEmbeddedManifest(final String manifestUrl, final ManifestListener listener) {
    String httpManifestUrl = httpManifestUrlBuilder(manifestUrl).build().toString();

    Request.Builder requestBuilder = ExponentUrls.addExponentHeadersToManifestUrl(
        httpManifestUrl,
        manifestUrl.equals(Constants.INITIAL_URL),
        mExponentSharedPreferences.getSessionSecret()
    );
    requestBuilder.header("Exponent-Accept-Signature", "true");
    requestBuilder.header("Expo-JSON-Error", "true");
    String finalUri = requestBuilder.build().url().toString();

    String embeddedResponse = mExponentNetwork.getClient().getHardCodedResponse(finalUri);

    try {
      JSONObject embeddedManifest = new JSONObject(embeddedResponse);
      embeddedManifest.put(ExponentManifest.MANIFEST_LOADED_FROM_CACHE_KEY, true);
      fetchManifestStep3(manifestUrl, ManifestFactory.INSTANCE.getRawManifestFromJson(embeddedManifest), true, listener);
    } catch (Exception e) {
      listener.onError(new Exception("Could not load embedded manifest. Are you sure this experience has been published?", e));
      e.printStackTrace();
    }
  }

  private void handleManifestResponse(ExpoResponse response, String manifestUrl, String httpManifestUrl, ManifestListener listener, boolean isEmbedded, boolean isCached) {
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
      fetchManifestStep2(manifestUrl, httpManifestUrl, manifestString, response.headers(), listener, isEmbedded, isCached);
    } catch (JSONException e) {
      listener.onError(e);
    } catch (IOException e) {
      listener.onError(e);
    } catch (URISyntaxException e) {
      listener.onError(e);
    }
  }

  private RawManifest newerManifest(RawManifest manifest1, RawManifest manifest2) throws JSONException, ParseException {
    // use commitTime instead of publishedTime as it is more accurate;
    // however, fall back to publishedTime in case older cached manifests do not contain
    // the commitTime key (we have not always served it)
    @Nullable String manifest1Timestamp = manifest1.getCommitTime();
    if (manifest1Timestamp == null) {
      manifest1Timestamp = manifest1.getPublishedTime();
    }
    @Nullable String manifest2Timestamp = manifest2.getCommitTime();
    if (manifest2Timestamp == null) {
      manifest2Timestamp = manifest2.getPublishedTime();
    }

    // SimpleDateFormat on Android does not support the ISO-8601 representation of the timezone,
    // namely, using 'Z' to represent GMT. Since all our dates here are in the same timezone,
    // and we're just comparing them relative to each other, we can just ignore this character.
    DateFormat formatter = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
    Date manifest1Date = formatter.parse(manifest1Timestamp);
    Date manifest2Date = formatter.parse(manifest2Timestamp);

    if (manifest1Date.after(manifest2Date)) {
      return manifest1;
    } else {
      return manifest2;
    }
  }

  private boolean isManifestSDKVersionValid(RawManifest manifest) {
    @Nullable String sdkVersion = manifest.getSDKVersionNullable();
    if (sdkVersion == null) {
      return false;
    }

    if (RNObject.UNVERSIONED.equals(sdkVersion)) {
      return true;
    } else {
      for (String version : Constants.SDK_VERSIONS_LIST) {
        if (version.equals(sdkVersion)) {
          return true;
        }
      }
      return false;
    }
  }

  private JSONObject extractManifest(final String manifestString) throws IOException {
      try {
          return new JSONObject(manifestString);
      } catch (JSONException e) {
        // Ignore this error, try to parse manifest as array
      }

      try {
        // the manifestString could be an array of manifest objects
        // in this case, we choose the first compatible manifest in the array
        JSONArray manifestArray = new JSONArray(manifestString);
        for (int i = 0; i < manifestArray.length(); i++) {
          JSONObject manifestCandidate = manifestArray.getJSONObject(i);
          String sdkVersion = manifestCandidate.getString(MANIFEST_SDK_VERSION_KEY);
          if (Constants.SDK_VERSIONS_LIST.contains(sdkVersion)){
            return manifestCandidate;
          }
        }
      } catch (JSONException e){
        throw new IOException("Manifest string is not a valid JSONObject or JSONArray: " + manifestString, e);
      }
      throw new IOException("No compatible manifest found. SDK Versions supported: " + Constants.SDK_VERSIONS + " Provided manifestString: " + manifestString);
  }

  private void fetchManifestStep2(final String manifestUrl, final String httpManifestUrl, final String manifestString, final ExpoHeaders headers, final ManifestListener listener, final boolean isEmbedded, boolean isCached) throws JSONException, URISyntaxException, IOException {
    if (Constants.DEBUG_MANIFEST_METHOD_TRACING) {
      Debug.stopMethodTracing();
    }
    if (headers != null) {
      Analytics.markEvent(Analytics.TimedEvent.FINISHED_MANIFEST_NETWORK_REQUEST);
    }

    final JSONObject outerManifestJson = extractManifest(manifestString);
    final boolean isMainShellAppExperience = manifestUrl.equals(Constants.INITIAL_URL);
    final URI parsedManifestUrl = new URI(manifestUrl);

    boolean isManifestSigned = outerManifestJson.has(MANIFEST_STRING_KEY) && outerManifestJson.has(MANIFEST_SIGNATURE_KEY);

    JSONObject manifestJson = outerManifestJson;
    if (isManifestSigned) {
      // get inner manifest if manifest is wrapped in signature
      manifestJson = new JSONObject(outerManifestJson.getString(MANIFEST_STRING_KEY));
    }

    RawManifest manifest = ManifestFactory.INSTANCE.getRawManifestFromJson(manifestJson);

    // if the manifest we are passed is from the cache, we need to get the embedded manifest so that
    // we can compare them in case embedded manifest is newer (i.e. user has installed a new APK)
    boolean isUsingEmbeddedManifest = isEmbedded;
    if (!isEmbedded && isCached) {
      String embeddedResponse = mExponentNetwork.getClient().getHardCodedResponse(httpManifestUrl);
      if (embeddedResponse != null) {
        try {
          RawManifest embeddedManifest = ManifestFactory.INSTANCE.getRawManifestFromJson(new JSONObject(embeddedResponse));
          if (!isManifestSDKVersionValid(manifest)) {
            // if we somehow try to load a cached manifest with an invalid SDK version,
            // fall back immediately to the embedded manifest, which should never have an
            // invalid SDK version.
            manifest = embeddedManifest;
          } else {
            manifest = newerManifest(embeddedManifest, manifest);
          }
          isUsingEmbeddedManifest = embeddedManifest == manifest;
        } catch (Exception e) {
          EXL.e(TAG, e);
        }
      }
    }
    manifest.getRawJson().put(MANIFEST_LOADED_FROM_CACHE_KEY, isCached || isUsingEmbeddedManifest);

    if (isManifestSigned) {
      final boolean isOffline = !ExponentNetwork.isNetworkAvailable(mContext);

      if (isAnonymousExperience(manifest) || isMainShellAppExperience || isUsingEmbeddedManifest) {
        // Automatically verified.
        fetchManifestStep3(manifestUrl, manifest, true, listener);
      } else {
        final RawManifest finalManifest = manifest;
        mCrypto.verifyPublicRSASignature(Constants.API_HOST + "/--/manifest-public-key",
            outerManifestJson.getString(MANIFEST_STRING_KEY), outerManifestJson.getString(MANIFEST_SIGNATURE_KEY), new Crypto.RSASignatureListener() {
              @Override
              public void onError(String errorMessage, boolean isNetworkError) {
                if (isOffline && isNetworkError) {
                  // automatically validate if offline and don't have public key
                  // TODO: we need to evict manifest from the cache if it doesn't pass validation when online
                  fetchManifestStep3(manifestUrl, finalManifest, true, listener);
                } else {
                  Log.w(TAG, errorMessage);
                  fetchManifestStep3(manifestUrl, finalManifest, false, listener);
                }
              }

              @Override
              public void onCompleted(boolean isValid) {
                fetchManifestStep3(manifestUrl, finalManifest, isValid, listener);
              }
            });
      }
    } else {
      // if we're using a cached manifest that's stored without the signature, we can assume
      // we've already verified it previously
      if (isCached || isUsingEmbeddedManifest || isMainShellAppExperience) {
        fetchManifestStep3(manifestUrl, manifest, true, listener);
      } else if (isThirdPartyHosted(parsedManifestUrl)){
        // Sandbox third party apps and consider them verified
        // for https urls, sandboxed id is of form quinlanj.github.io/myProj-myApp
        // for http urls, sandboxed id is of form UNVERIFIED-quinlanj.github.io/myProj-myApp
        if (!Constants.isStandaloneApp()){
          String protocol = parsedManifestUrl.getScheme();
          String securityPrefix = protocol.equals("https") || protocol.equals("exps") ? "" : "UNVERIFIED-";
          String path = parsedManifestUrl.getPath() != null ? parsedManifestUrl.getPath() : "";
          String slug = manifest.getSlug() != null ? manifest.getSlug() : "";
          String sandboxedId = securityPrefix + parsedManifestUrl.getHost() + path + "-" + slug;
          manifest.getRawJson().put(MANIFEST_ID_KEY, sandboxedId);
        }
        fetchManifestStep3(manifestUrl, manifest, true, listener);
      } else {
        fetchManifestStep3(manifestUrl, manifest, false, listener);
      }
    }

    if (headers != null) {
      final String exponentServerHeader = headers.get(EXPONENT_SERVER_HEADER);
      if (exponentServerHeader != null) {
        try {
          JSONObject eventProperties = new JSONObject(exponentServerHeader);
          Analytics.logEvent(Analytics.LOAD_DEVELOPER_MANIFEST, eventProperties);
        } catch (Throwable e) {
          EXL.e(TAG, e);
        }
      }
    }
  }

  private boolean isThirdPartyHosted(final URI uri) {
    String host= uri.getHost();
    boolean isExpoHost = host.equals("exp.host") || host.equals("expo.io") || host.equals("exp.direct") || host.equals("expo.test") ||
        host.endsWith(".exp.host") || host.endsWith(".expo.io") || host.endsWith(".exp.direct") || host.endsWith(".expo.test");
    return !isExpoHost;
  }

  private void fetchManifestStep3(final String manifestUrl, final RawManifest manifest, final boolean isVerified, final ManifestListener listener) {
    try {
      manifest.getBundleURL();
    } catch (JSONException e) {
      listener.onError("No bundleUrl in manifest");
      return;
    }

    try {
      manifest.getRawJson().put(MANIFEST_IS_VERIFIED_KEY, isVerified);
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

  @WorkerThread
  public Bitmap loadIconBitmapSync(final String iconUrl) {
    Bitmap icon = getIconFromCache(iconUrl);
    if (icon != null) {
      return icon;
    }

    return loadIconTask(iconUrl);
  }

  public void loadIconBitmap(final String iconUrl, final BitmapListener listener) {
    Bitmap icon = getIconFromCache(iconUrl);
    if (icon != null) {
      listener.onLoadBitmap(icon);
      return;
    }

    new AsyncTask<Void, Void, Bitmap>() {
      @Override
      protected Bitmap doInBackground(Void... params) {
        return loadIconTask(iconUrl);
      }

      @Override
      protected void onPostExecute(Bitmap result) {
        listener.onLoadBitmap(result);
      }
    }.execute();
  }

  @Nullable
  private Bitmap getIconFromCache(@Nullable final String iconUrl) {
    if (TextUtils.isEmpty(iconUrl)) {
      return BitmapFactory.decodeResource(mContext.getResources(), R.mipmap.ic_launcher);
    }

    return mMemoryCache.get(iconUrl);
  }


  private Bitmap loadIconTask(final String iconUrl) {
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

  public int getColorFromManifest(final RawManifest manifest) {
    @Nullable String colorString = manifest.getPrimaryColor();
    if (colorString != null && ColorParser.isValid(colorString)) {
      return Color.parseColor(colorString);
    } else {
      return R.color.colorPrimary;
    }
  }

  public boolean isAnonymousExperience(final RawManifest manifest) {
    try {
      final String id = manifest.getID();
      return id != null && id.startsWith(ANONYMOUS_EXPERIENCE_PREFIX);
    } catch (JSONException e) {
      return false;
    }
  }

  private RawManifest getLocalKernelManifest() {
    try {
      JSONObject manifest = new JSONObject(ExponentBuildConstants.BUILD_MACHINE_KERNEL_MANIFEST);
      manifest.put(MANIFEST_IS_VERIFIED_KEY, true);
      return ManifestFactory.INSTANCE.getRawManifestFromJson(manifest);
    } catch (JSONException e) {
      throw new RuntimeException("Can't get local manifest: " + e.toString());
    }
  }

  private RawManifest getRemoteKernelManifest() {
    try {
      InputStream inputStream = mContext.getAssets().open(EMBEDDED_KERNEL_MANIFEST_ASSET);
      String jsonString = IOUtils.toString(inputStream);
      JSONObject manifest = new JSONObject(jsonString);
      manifest.put(MANIFEST_IS_VERIFIED_KEY, true);
      return ManifestFactory.INSTANCE.getRawManifestFromJson(manifest);
    } catch (Exception e) {
      KernelProvider.getInstance().handleError(e);
      return null;
    }
  }

  public RawManifest getKernelManifest() {
    RawManifest manifest;
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
}
