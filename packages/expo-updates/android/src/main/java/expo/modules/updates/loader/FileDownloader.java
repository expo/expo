package expo.modules.updates.loader;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.Nullable;
import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.UpdatesUtils;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Date;
import java.util.Iterator;
import java.util.Map;

import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.launcher.NoDatabaseLauncher;
import expo.modules.updates.manifest.Manifest;
import expo.modules.updates.manifest.ManifestFactory;
import expo.modules.updates.manifest.ManifestResponse;
import expo.modules.updates.selectionpolicy.SelectionPolicies;
import okhttp3.Cache;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class FileDownloader {

  private static final String TAG = FileDownloader.class.getSimpleName();

  private OkHttpClient mClient;

  public interface FileDownloadCallback {
    void onFailure(Exception e);
    void onSuccess(File file, @Nullable byte[] hash);
  }

  public interface ManifestDownloadCallback {
    void onFailure(String message, Exception e);
    void onSuccess(Manifest manifest);
  }

  public interface AssetDownloadCallback {
    void onFailure(Exception e, AssetEntity assetEntity);
    void onSuccess(AssetEntity assetEntity, boolean isNew);
  }

  public FileDownloader(Context context) {
    mClient = new OkHttpClient.Builder().cache(getCache(context)).build();
  }

  private Cache getCache(Context context) {
    int cacheSize = 50 * 1024 * 1024; // 50 MiB
    return new Cache(getCacheDirectory(context), cacheSize);
  }

  private File getCacheDirectory(Context context) {
    return new File(context.getCacheDir(), "okhttp");
  }

  public void downloadFileToPath(Request request, final File destination, final FileDownloadCallback callback) {
    downloadData(request, new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        callback.onFailure(e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        if (!response.isSuccessful()) {
          callback.onFailure(new Exception("Network request failed: " + response.body().string()));
          return;
        }

        try (
            InputStream inputStream = response.body().byteStream();
        ) {
          byte[] hash = UpdatesUtils.sha256AndWriteToFile(inputStream, destination);
          callback.onSuccess(destination, hash);
        } catch (Exception e) {
          Log.e(TAG, "Failed to download file to destination " + destination.toString(), e);
          callback.onFailure(e);
        }
      }
    });
  }

  public void downloadManifest(final UpdatesConfiguration configuration, JSONObject extraHeaders, final Context context, final ManifestDownloadCallback callback) {
    try {
      downloadData(setHeadersForManifestUrl(configuration, extraHeaders, context), new Callback() {
        @Override
        public void onFailure(Call call, IOException e) {
          callback.onFailure("Failed to download manifest from URL: " + configuration.getUpdateUrl(), e);
        }

        @Override
        public void onResponse(Call call, Response response) throws IOException {
          if (!response.isSuccessful()) {
            callback.onFailure("Failed to download manifest from URL: " + configuration.getUpdateUrl(), new Exception(response.body().string()));
            return;
          }

          try {
            String updateResponseBody = response.body().string();
            JSONObject updateResponseJson = extractUpdateResponseJson(updateResponseBody, configuration);

            final boolean isSignatureInBody = updateResponseJson.has("manifestString") && updateResponseJson.has("signature");
            final String signature = isSignatureInBody ? updateResponseJson.optString("signature", null) : response.header("expo-manifest-signature", null);
            
            /**
             * The updateResponseJson is just the manifest when it is unsigned, or the signature is sent as a header.
             * If the signature is in the body, the updateResponseJson looks like:
             *  {
             *    manifestString: string;
             *    signature: string;
             *  }
             */
            final String manifestString = isSignatureInBody ? updateResponseJson.getString("manifestString") : updateResponseBody;
            JSONObject preManifest = new JSONObject(manifestString);

            // XDL serves unsigned manifests with the `signature` key set to "UNSIGNED".
            // We should treat these manifests as unsigned rather than signed with an invalid signature.
            boolean isUnsignedFromXDL = "UNSIGNED".equals(signature);

            if (signature != null && !isUnsignedFromXDL) {
              Crypto.verifyPublicRSASignature(
                manifestString,
                signature,
                FileDownloader.this,
                new Crypto.RSASignatureListener() {
                    @Override
                    public void onError(Exception e, boolean isNetworkError) {
                      callback.onFailure("Could not validate signed manifest", e);
                    }

                    @Override
                    public void onCompleted(boolean isValid) {
                      if (isValid) {
                        try {
                          createManifest(preManifest, response, true, configuration, callback);
                        } catch (Exception e) {
                          callback.onFailure("Failed to parse manifest data", e);
                        }
                      } else {
                        callback.onFailure("Manifest signature is invalid; aborting", new Exception("Manifest signature is invalid"));
                      }
                    }
                  }
              );
            } else {
              createManifest(preManifest, response, false, configuration, callback);
            }
          } catch (Exception e) {
            callback.onFailure("Failed to parse manifest data", e);
          }
        }
      });
    } catch (Exception e) {
      callback.onFailure("Failed to download manifest from URL " + configuration.getUpdateUrl().toString(), e);
    }
  }

  private static void createManifest(
    JSONObject preManifest,
    Response response,
    boolean isVerified,
    UpdatesConfiguration configuration,
    ManifestDownloadCallback callback
  ) throws Exception {
    if (configuration.expectsSignedManifest()) {
      preManifest.put("isVerified", isVerified);
    }
    Manifest manifest = ManifestFactory.INSTANCE.getManifest(preManifest, new ManifestResponse(response), configuration);
    if (!SelectionPolicies.matchesFilters(manifest.getUpdateEntity(), manifest.getManifestFilters())) {
      String message = "Downloaded manifest is invalid; provides filters that do not match its content";
      callback.onFailure(message, new Exception(message));
    } else {
      callback.onSuccess(manifest);
    }
  }

  public void downloadAsset(final AssetEntity asset, File destinationDirectory, UpdatesConfiguration configuration, final AssetDownloadCallback callback) {
    if (asset.url == null) {
      callback.onFailure(new Exception("Could not download asset " + asset.key + " with no URL"), asset);
      return;
    }

    final String filename = UpdatesUtils.createFilenameForAsset(asset);
    File path = new File(destinationDirectory, filename);

    if (path.exists()) {
      asset.relativePath = filename;
      callback.onSuccess(asset, false);
    } else {
      try {
        downloadFileToPath(setHeadersForUrl(asset.url, configuration), path, new FileDownloadCallback() {
          @Override
          public void onFailure(Exception e) {
            callback.onFailure(e, asset);
          }

          @Override
          public void onSuccess(File file, @Nullable byte[] hash) {
            asset.downloadTime = new Date();
            asset.relativePath = filename;
            asset.hash = hash;
            callback.onSuccess(asset, true);
          }
        });
      } catch (Exception e) {
        callback.onFailure(e, asset);
      }
    }
  }

  public void downloadData(Request request, Callback callback) {
    downloadData(request, callback, false);
  }

  private void downloadData(final Request request, final Callback callback, final boolean isRetry) {
    mClient.newCall(request).enqueue(new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        if (isRetry) {
          callback.onFailure(call, e);
        } else {
          downloadData(request, callback, true);
        }
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        callback.onResponse(call, response);
      }
    });
  }

  private static JSONObject extractUpdateResponseJson(String manifestString, UpdatesConfiguration configuration) throws IOException {
    try {
      return new JSONObject(manifestString);
    } catch (JSONException e) {
      // Ignore this error, try to parse manifest as array
    }

    // TODO: either add support for runtimeVersion or deprecate multi-manifests
    try {
      // the manifestString could be an array of manifest objects
      // in this case, we choose the first compatible manifest in the array
      JSONArray manifestArray = new JSONArray(manifestString);
      for (int i = 0; i < manifestArray.length(); i++) {
        JSONObject manifestCandidate = manifestArray.getJSONObject(i);
        String sdkVersion = manifestCandidate.getString("sdkVersion");
        if (configuration.getSdkVersion() != null && Arrays.asList(configuration.getSdkVersion().split(",")).contains(sdkVersion)){
          return manifestCandidate;
        }
      }
    } catch (JSONException e) {
      throw new IOException("Manifest string is not a valid JSONObject or JSONArray: " + manifestString, e);
    }
    throw new IOException("No compatible manifest found. SDK Versions supported: " + configuration.getSdkVersion() + " Provided manifestString: " + manifestString);
  }

  private static Request setHeadersForUrl(Uri url, UpdatesConfiguration configuration) {
    Request.Builder requestBuilder = new Request.Builder()
            .url(url.toString())
            .header("Expo-Platform", "android")
            .header("Expo-API-Version", "1")
            .header("Expo-Updates-Environment", "BARE");

    for (Map.Entry<String, String> entry : configuration.getRequestHeaders().entrySet()) {
      requestBuilder.header(entry.getKey(), entry.getValue());
    }

    return requestBuilder.build();
  }

  /* package */ static Request setHeadersForManifestUrl(UpdatesConfiguration configuration, JSONObject extraHeaders, Context context) {
    Request.Builder requestBuilder = new Request.Builder()
            .url(configuration.getUpdateUrl().toString());

    // apply extra headers before anything else, so they don't override preset headers
    if (extraHeaders != null) {
      Iterator<String> keySet = extraHeaders.keys();
      while (keySet.hasNext()) {
        String key = keySet.next();
        requestBuilder.header(key, extraHeaders.optString(key, ""));
      }
    }

    requestBuilder = requestBuilder
            .header("Accept", "application/expo+json,application/json")
            .header("Expo-Platform", "android")
            .header("Expo-API-Version", "1")
            .header("Expo-Updates-Environment", "BARE")
            .header("Expo-JSON-Error", "true")
            .header("Expo-Accept-Signature", String.valueOf(configuration.expectsSignedManifest()));

    String runtimeVersion = configuration.getRuntimeVersion();
    String sdkVersion = configuration.getSdkVersion();
    if (runtimeVersion != null && runtimeVersion.length() > 0) {
      requestBuilder = requestBuilder.header("Expo-Runtime-Version", runtimeVersion);
    } else {
      requestBuilder = requestBuilder.header("Expo-SDK-Version", sdkVersion);
    }

    String releaseChannel = configuration.getReleaseChannel();
    requestBuilder = requestBuilder.header("Expo-Release-Channel", releaseChannel);

    String previousFatalError = NoDatabaseLauncher.consumeErrorLog(context);
    if (previousFatalError != null) {
      // some servers can have max length restrictions for headers,
      // so we restrict the length of the string to 1024 characters --
      // this should satisfy the requirements of most servers
      requestBuilder = requestBuilder.header(
        "Expo-Fatal-Error",
        previousFatalError.substring(0, Math.min(1024, previousFatalError.length()))
      );
    }

    for (Map.Entry<String, String> entry : configuration.getRequestHeaders().entrySet()) {
      requestBuilder.header(entry.getKey(), entry.getValue());
    }

    return requestBuilder.build();
  }
}
