package host.exp.exponent.experience.SplashScreen;

import android.graphics.Color;

import org.json.JSONObject;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import host.exp.exponent.utils.ColorParser;
import expo.modules.splashscreen.SplashScreenMode;

import static host.exp.exponent.ExponentManifest.MANIFEST_ANDROID_INFO_KEY;
import static host.exp.exponent.ExponentManifest.MANIFEST_SPLASH_BACKGROUND_COLOR;
import static host.exp.exponent.ExponentManifest.MANIFEST_SPLASH_IMAGE_URL_KEY;
import static host.exp.exponent.ExponentManifest.MANIFEST_SPLASH_INFO_KEY;
import static host.exp.exponent.ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE;

public class ExperienceSplashScreenConfig {

  @NonNull
  private SplashScreenMode mode = SplashScreenMode.CONTAIN;
  @NonNull
  private Integer backgroundColor = Color.parseColor("#ffffff");
  @Nullable
  private String imageUrl = null;

  public int getBackgroundColor() {
    return backgroundColor;
  }

  @NonNull
  public SplashScreenMode getMode() {
    return mode;
  }

  @Nullable
  public String getImageUrl() {
    return imageUrl;
  }

  private ExperienceSplashScreenConfig() {}

  static @NonNull ExperienceSplashScreenConfig parseManifest(@Nullable JSONObject manifest) {
    SplashScreenMode mode = parseResizeMode(manifest);
    Integer backgroundColor = parseBackgroundColor(manifest);
    String imageUrl = parseImageUrl(manifest);

    ExperienceSplashScreenConfig config = new ExperienceSplashScreenConfig();

    if (mode != null) {
      config.mode = mode;
    }
    if (backgroundColor != null) {
      config.backgroundColor = backgroundColor;
    }
    if (imageUrl != null) {
      config.imageUrl = imageUrl;
    }

    return config;
  }

  @Nullable private static SplashScreenMode parseResizeMode(@Nullable JSONObject manifest) {
    String resizeMode = getStringFromManifest(
      manifest,
      new String[] { MANIFEST_ANDROID_INFO_KEY, MANIFEST_SPLASH_INFO_KEY, MANIFEST_SPLASH_RESIZE_MODE },
      new String[] { MANIFEST_SPLASH_INFO_KEY, MANIFEST_SPLASH_RESIZE_MODE }
    );
    return SplashScreenMode.fromString(resizeMode);
  }

  @Nullable private static Integer parseBackgroundColor(@Nullable JSONObject manifest) {
    String backgroundColor = getStringFromManifest(
      manifest,
      new String[] { MANIFEST_ANDROID_INFO_KEY, MANIFEST_SPLASH_INFO_KEY, MANIFEST_SPLASH_BACKGROUND_COLOR },
      new String[] { MANIFEST_SPLASH_INFO_KEY, MANIFEST_SPLASH_BACKGROUND_COLOR }
    );

    if (ColorParser.isValid(backgroundColor)) {
      return Color.parseColor(backgroundColor);
    }
    return null;
  }

  @Nullable private static String parseImageUrl(@Nullable JSONObject manifest) {
    return getStringFromManifest(
      manifest,
      new String[] { MANIFEST_ANDROID_INFO_KEY, MANIFEST_SPLASH_INFO_KEY, MANIFEST_SPLASH_IMAGE_URL_KEY},
      new String[] { MANIFEST_SPLASH_INFO_KEY, MANIFEST_SPLASH_IMAGE_URL_KEY}
    );
  }

  @Nullable private static String getStringFromManifest(@Nullable JSONObject manifest, String[] ...paths) {
    for (String[] path: paths) {
      String pathResult = getStringFromManifest(manifest, path);
      if (pathResult != null) {
        return pathResult;
      }
    }
    return null;
  }

  @Nullable private static String getStringFromManifest(@Nullable JSONObject manifest, String[] path) {
    JSONObject json = manifest;
    if (json == null) {
      return null;
    }
    for (int i = 0; i < path.length; i++) {
      boolean isLastKey = i == path.length - 1;
      String key = path[i];
      if (!json.has(key)) {
        break;
      }
      if (isLastKey) {
        return json.optString(key);
      }
      json = json.optJSONObject(key);
    }
    return null;
  }
}
