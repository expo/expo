// Copyright 2015-present 650 Industries. All rights reserved.

package host.exp.exponent;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.support.annotation.Nullable;

import net.openid.appauth.AuthorizationException;
import net.openid.appauth.AuthorizationResponse;
import net.openid.appauth.AuthorizationService;
import net.openid.appauth.TokenResponse;

import de.greenrobot.event.EventBus;

public class OAuthResultActivity extends Activity {
  public static final String EXTRA_REDIRECT_EXPERIENCE_URL = "redirectExperienceUrl";

  public static class OAuthResultEvent {
    @Nullable public TokenResponse response;
    @Nullable public AuthorizationException error;

    public OAuthResultEvent(@Nullable TokenResponse response, @Nullable AuthorizationException error) {
      this.response = response;
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

    AuthorizationResponse resp = AuthorizationResponse.fromIntent(intent);
    AuthorizationException ex = AuthorizationException.fromIntent(intent);

    if (resp != null) {
      service.performTokenRequest(
          resp.createTokenExchangeRequest(),
          new AuthorizationService.TokenResponseCallback() {
            @Override public void onTokenRequestCompleted(
                TokenResponse resp, AuthorizationException ex) {
              if (resp != null) {
                EventBus.getDefault().post(new OAuthResultEvent(resp, null));
              } else {
                EventBus.getDefault().post(new OAuthResultEvent(null, ex));
              }
            }
          });
    } else {
      EventBus.getDefault().post(new OAuthResultEvent(null, ex));
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
