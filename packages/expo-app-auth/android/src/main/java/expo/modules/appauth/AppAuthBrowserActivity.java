package expo.modules.appauth;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationResponse;

import de.greenrobot.event.EventBus;

public class AppAuthBrowserActivity extends Activity {
  public static final String EXTRA_REDIRECT_EXPERIENCE_URL = "redirectExperienceUrl";

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    handleIntent(getIntent());
  }

  @Override
  protected void onNewIntent(Intent intent) {
    super.onNewIntent(intent);
    handleIntent(intent);
  }

  private void handleIntent(Intent intent) {
    EventBus.getDefault().post(new OAuthResultEvent(intent));

    if (intent.hasExtra(EXTRA_REDIRECT_EXPERIENCE_URL)) {
      String url = intent.getStringExtra(EXTRA_REDIRECT_EXPERIENCE_URL);
      Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url))
          .addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY | Intent.FLAG_ACTIVITY_CLEAR_TOP |
              Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_NEW_TASK);
      startActivity(browserIntent);
    }

    finish();
  }

  public static class OAuthResultEvent {
    @Nullable
    public AuthorizationResponse response;
    @Nullable
    public AuthorizationException exception;

    public OAuthResultEvent(@Nullable Intent intent) {

      response = AuthorizationResponse.fromIntent(intent);
      exception = AuthorizationException.fromIntent(intent);
    }
  }
}

