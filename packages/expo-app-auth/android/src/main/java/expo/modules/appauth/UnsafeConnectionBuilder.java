package expo.modules.appauth;

import net.openid.appauth.connectivity.ConnectionBuilder;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import androidx.annotation.NonNull;
import android.net.Uri;

// This cannot support a more robust unsafe connection builder due to Google Play Store restrictions.
// See more https://support.google.com/faqs/answer/6346016?hl=en
public final class UnsafeConnectionBuilder implements ConnectionBuilder {

  public static final UnsafeConnectionBuilder INSTANCE = new UnsafeConnectionBuilder();

  @NonNull
  @Override
  public HttpURLConnection openConnection(@NonNull Uri uri) throws IOException {
      return (HttpURLConnection) new URL(uri.toString()).openConnection();
  }
}