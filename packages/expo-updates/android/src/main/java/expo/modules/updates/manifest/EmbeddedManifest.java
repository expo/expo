package expo.modules.updates.manifest;

import android.content.Context;
import android.util.Log;

import androidx.annotation.Nullable;

import org.apache.commons.io.IOUtils;
import org.json.JSONObject;

import java.io.InputStream;

import expo.modules.updates.UpdatesConfiguration;
import expo.modules.updates.loader.EmbeddedLoader;

public class EmbeddedManifest {

  private static final String TAG = EmbeddedManifest.class.getSimpleName();
  private static final String MANIFEST_FILENAME = "app.manifest";

  private static UpdateManifest sEmbeddedManifest = null;

  public static @Nullable UpdateManifest get(Context context, UpdatesConfiguration configuration) {
    if (!configuration.hasEmbeddedUpdate()) {
      return null;
    }

    if (sEmbeddedManifest == null) {
      try (InputStream stream = context.getAssets().open(MANIFEST_FILENAME)) {
        String manifestString = IOUtils.toString(stream, "UTF-8");
        JSONObject manifestJson = new JSONObject(manifestString);
        // automatically verify embedded manifest since it was already codesigned
        manifestJson.put("isVerified", true);
        sEmbeddedManifest = ManifestFactory.INSTANCE.getEmbeddedManifest(manifestJson, configuration);
      } catch (Exception e) {
        Log.e(TAG, "Could not read embedded manifest", e);
        throw new AssertionError("The embedded manifest is invalid or could not be read. Make sure you have configured expo-updates correctly in android/app/build.gradle. " + e.getMessage());
      }
    }

    return sEmbeddedManifest;
  }
}
