// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent.oauth;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.annotation.Nullable;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.TokenResponse;

import de.greenrobot.event.EventBus;

public class OAuthResultActivity extends Activity {
  public static final String EXTRA_REDIRECT_EXPERIENCE_URL = "redirectExperienceUrl";

  public static class OAuthResultEvent {
    @Nullable public AuthorizationResponse authorizationResponse;
    @Nullable public TokenResponse tokenResponse;
    @Nullable public AuthorizationException error;

    public OAuthResultEvent(@Nullable AuthorizationResponse authorizationResponse,
                            @Nullable TokenResponse tokenResponse,
                            @Nullable AuthorizationException error) {
      this.authorizationResponse = authorizationResponse;
      this.tokenResponse = tokenResponse;
      this.error = error;
    }
  }

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
    AuthorizationService service = new AuthorizationService(this);

    final AuthorizationResponse authorizationResponse = AuthorizationResponse.fromIntent(intent);
    AuthorizationException authorizationException = AuthorizationException.fromIntent(intent);

    if (authorizationResponse != null) {
      service.performTokenRequest(
              authorizationResponse.createTokenExchangeRequest(),
          new AuthorizationService.TokenResponseCallback() {
            @Override public void onTokenRequestCompleted(
                TokenResponse tokenResponse, AuthorizationException tokenException) {
              if (tokenResponse != null) {
                EventBus.getDefault().post(new OAuthResultEvent(authorizationResponse, tokenResponse, null));
              } else {
                EventBus.getDefault().post(new OAuthResultEvent(null, null, tokenException));
              }
            }
          });
    } else {
      EventBus.getDefault().post(new OAuthResultEvent(null, null, authorizationException));
    }

    if (intent.hasExtra(EXTRA_REDIRECT_EXPERIENCE_URL)) {
      Intent focusExperienceTaskIntent = new Intent(Intent.ACTION_VIEW);
      focusExperienceTaskIntent.setData(Uri.parse(intent.getStringExtra(EXTRA_REDIRECT_EXPERIENCE_URL)));
      focusExperienceTaskIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      startActivity(focusExperienceTaskIntent);
    }

    finish();
  }
}
