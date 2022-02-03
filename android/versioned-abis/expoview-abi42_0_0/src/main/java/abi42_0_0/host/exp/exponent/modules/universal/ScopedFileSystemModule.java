package abi42_0_0.host.exp.exponent.modules.universal;

import android.content.Context;

import org.apache.commons.io.IOUtils;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import abi42_0_0.expo.modules.filesystem.FileSystemModule;
import host.exp.exponent.Constants;

public class ScopedFileSystemModule extends FileSystemModule {
  private static final String SHELL_APP_EMBEDDED_MANIFEST_PATH = "shell-app-manifest.json";

  public ScopedFileSystemModule(Context context) {
    super(context);
  }

  @Override
  public Map<String, Object> getConstants() {
    Map<String, Object> constants = new HashMap<>(super.getConstants());
    constants.put("bundledAssets", getBundledAssets());
    return constants;
  }

  private List<String> getBundledAssets() {
    // Fastpath, only standalone apps support bundled assets.
    if (!Constants.isStandaloneApp()) {
      return null;
    }
    try {
      InputStream inputStream = getContext().getAssets().open(SHELL_APP_EMBEDDED_MANIFEST_PATH);
      String jsonString = IOUtils.toString(inputStream);
      JSONObject manifest = new JSONObject(jsonString);
      JSONArray bundledAssetsJSON = manifest.getJSONArray("bundledAssets");
      if (bundledAssetsJSON == null) {
        return null;
      }
      List<String> result = new ArrayList<>();
      for (int i = 0; i < bundledAssetsJSON.length(); i++) {
        result.add(bundledAssetsJSON.getString(i));
      }
      return result;
    } catch (Exception ex) {
      ex.printStackTrace();
      return null;
    }
  }
}
