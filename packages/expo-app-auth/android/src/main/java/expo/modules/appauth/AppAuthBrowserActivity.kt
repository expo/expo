package expo.modules.appauth

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import de.greenrobot.event.EventBus
import net.openid.appauth.AuthorizationException
import net.openid.appauth.AuthorizationResponse

class AppAuthBrowserActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
  }

  private fun handleIntent(intent: Intent) {
    EventBus.getDefault().post(OAuthResultEvent(intent))
    if (intent.hasExtra(EXTRA_REDIRECT_EXPERIENCE_URL)) {
      val url = intent.getStringExtra(EXTRA_REDIRECT_EXPERIENCE_URL)
      val browserIntent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
        .addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY or Intent.FLAG_ACTIVITY_CLEAR_TOP or
          Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK)
      startActivity(browserIntent)
    }
    finish()
  }

  class OAuthResultEvent(intent: Intent?) {
    val response: AuthorizationResponse? = AuthorizationResponse.fromIntent(intent!!)
    val exception: AuthorizationException? = AuthorizationException.fromIntent(intent)
  }

  companion object {
    const val EXTRA_REDIRECT_EXPERIENCE_URL = "redirectExperienceUrl"
  }
}