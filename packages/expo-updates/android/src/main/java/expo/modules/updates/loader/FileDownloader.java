package expo.modules.updates.loader;

import android.content.Context;
import android.net.Uri;
import android.util.Log;

import androidx.annotation.Nullable;
import expo.modules.updates.UpdatesUtils;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Date;

import expo.modules.updates.UpdatesController;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.launcher.NoDatabaseLauncher;
import expo.modules.updates.manifest.Manifest;
import expo.modules.updates.manifest.ManifestFactory;
import okhttp3.CacheControl;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class FileDownloader {

  private static final String TAG = FileDownloader.class.getSimpleName();

  private static OkHttpClient sClient = new OkHttpClient.Builder().build();

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

  public static void downloadFileToPath(Request request, final File destination, final FileDownloadCallback callback) {
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

  public static void downloadManifest(final Uri url, final Context context, final ManifestDownloadCallback callback) {
    downloadData(addHeadersToManifestUrl(url, context), new Callback() {
      @Override
      public void onFailure(Call call, IOException e) {
        callback.onFailure("Failed to download manifest from URL: " + url, e);
      }

      @Override
      public void onResponse(Call call, Response response) throws IOException {
        if (!response.isSuccessful()) {
          callback.onFailure("Failed to download manifest from URL: " + url, new Exception(response.body().string()));
          return;
        }

        try {
          String manifestString = response.body().string();
          JSONObject manifestJson = new JSONObject(manifestString);
          if (manifestJson.has("manifestString") && manifestJson.has("signature")) {
            final String innerManifestString = manifestJson.getString("manifestString");
            Crypto.verifyPublicRSASignature(
                innerManifestString,
                manifestJson.getString("signature"),
                new Crypto.RSASignatureListener() {
                  @Override
                  public void onError(Exception e, boolean isNetworkError) {
                    callback.onFailure("Could not validate signed manifest", e);
                  }

                  @Override
                  public void onCompleted(boolean isValid) {
                    if (isValid) {
                      try {
                        Manifest manifest = ManifestFactory.getManifest(context, new JSONObject(innerManifestString));
                        callback.onSuccess(manifest);
                      } catch (JSONException e) {
                        callback.onFailure("Failed to parse manifest data", e);
                      }
                    } else {
                      callback.onFailure("Manifest signature is invalid; aborting", new Exception("Manifest signature is invalid"));
                    }
                  }
                }
            );
          } else {
            Manifest manifest = ManifestFactory.getManifest(context, manifestJson);
            callback.onSuccess(manifest);
          }
        } catch (Exception e) {
          callback.onFailure("Failed to parse manifest data", e);
        }
      }
    });
  }

  public static void downloadAsset(final AssetEntity asset, File destinationDirectory, Context context, final AssetDownloadCallback callback) {
    if (asset.url == null) {
      callback.onFailure(new Exception("Could not download asset " + asset.packagerKey + " with no URL"), asset);
      return;
    }

    final String filename = UpdatesUtils.createFilenameForAsset(asset);
    File path = new File(destinationDirectory, filename);

    if (path.exists()) {
      asset.relativePath = filename;
      callback.onSuccess(asset, false);
    } else {
      downloadFileToPath(addHeadersToUrl(asset.url, context), path, new FileDownloadCallback() {
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
    }
  }

  public static void downloadData(Request request, Callback callback) {
    downloadData(request, callback, false);
  }

  private static void downloadData(final Request request, final Callback callback, final boolean isRetry) {
    sClient.newCall(request).enqueue(new Callback() {
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

  private static Request addHeadersToUrl(Uri url, Context context) {
    Request.Builder requestBuilder = new Request.Builder()
            .url(url.toString())
            .header("Expo-Platform", "android")
            .header("Expo-Api-Version", "1")
            .header("Expo-Updates-Environment", "BARE");
    return requestBuilder.build();
  }

  private static Request addHeadersToManifestUrl(Uri url, Context context) {
    Request.Builder requestBuilder = new Request.Builder()
            .url(url.toString())
            .header("Accept", "application/expo+json,application/json")
            .header("Expo-Platform", "android")
            .header("Expo-Api-Version", "1")
            .header("Expo-Updates-Environment", "BARE")
            .header("Expo-JSON-Error", "true")
            .header("Expo-Accept-Signature", "true")
            .cacheControl(CacheControl.FORCE_NETWORK);

    String runtimeVersion = UpdatesController.getInstance().getUpdatesConfiguration().getRuntimeVersion();
    String sdkVersion = UpdatesController.getInstance().getUpdatesConfiguration().getSdkVersion();
    if (runtimeVersion != null && runtimeVersion.length() > 0) {
      requestBuilder = requestBuilder.header("Expo-Runtime-Version", runtimeVersion);
    } else {
      requestBuilder = requestBuilder.header("Expo-SDK-Version", sdkVersion);
    }

    String releaseChannel = UpdatesController.getInstance().getUpdatesConfiguration().getReleaseChannel();
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
    return requestBuilder.build();
  }
}
