package expo.modules.updates.manifest;

import androidx.annotation.Nullable;
import okhttp3.Response;

/**
 * Simple wrapper around okhttp3.Response
 * which allows us to mock the class in
 * Android instrumentation tests.
 */
public class ManifestResponse {
  private Response mResponse;

  public ManifestResponse(Response response) {
    mResponse = response;
  }

  @Nullable
  public String header(String name) {
    return mResponse.header(name);
  }

  @Nullable
  public String header(String name, String defaultValue) {
    return mResponse.header(name, defaultValue);
  }
}
