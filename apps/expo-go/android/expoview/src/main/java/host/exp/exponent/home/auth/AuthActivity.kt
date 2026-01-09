package host.exp.exponent.home.auth

import android.content.Context
import android.content.Intent
import android.content.Intent.ACTION_VIEW
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContract
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.net.toUri
import java.net.URLEncoder

private const val SESSION_SECRET_KEY = "session_secret"
private const val AUTH_REQUEST_TYPE_KEY = "auth_request_type"

private const val WEBSITE_ORIGIN = "https://expo.dev"

private const val REDIRECT_SCHEME = "expauth"
private const val REDIRECT_HOST = "auth"
private const val REDIRECT_BASE = "$REDIRECT_SCHEME://$REDIRECT_HOST"

class AuthActivity : AppCompatActivity() {
  class Contract : ActivityResultContract<AuthRequestType, AuthResult>() {
    override fun createIntent(
      context: Context,
      input: AuthRequestType
    ): Intent {
      return Intent(context, AuthActivity::class.java)
        .apply {
          action = ACTION_VIEW
          putExtra(AUTH_REQUEST_TYPE_KEY, input.type)
        }
    }

    override fun parseResult(
      resultCode: Int,
      intent: Intent?
    ): AuthResult {
      if (resultCode == RESULT_CANCELED || intent == null) {
        return AuthResult.Canceled
      }

      val sessionSecret = intent.getStringExtra(SESSION_SECRET_KEY) ?: return AuthResult.Canceled

      return AuthResult.Success(
        sessionSecret = sessionSecret,
      )
    }
  }

  private var wasStarted = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val authRequestType = intent.getStringExtra(AUTH_REQUEST_TYPE_KEY)
      ?: throw IllegalStateException("AuthActivity started without AuthRequestType extra")

    wasStarted = true
    openWebBrowserAsync(
      startUrl = createAuthUrl(AuthRequestType.fromString(authRequestType))
    )
  }

  override fun onResume() {
    super.onResume()

    // onNewIntent will handle the response from the web browser
    if (intent?.data?.host == REDIRECT_HOST) {
      return
    }

    // We just open the browser
    if (wasStarted) {
      wasStarted = false
      return
    }

    val resultIntent = Intent()
    setResult(RESULT_CANCELED, resultIntent)
    finish()
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)

    if (
      intent.action == ACTION_VIEW &&
      intent.data?.scheme == REDIRECT_SCHEME &&
      intent.data?.host == REDIRECT_HOST
    ) {
      val sessionSecret = intent.data?.getQueryParameter(SESSION_SECRET_KEY)

      if (sessionSecret.isNullOrEmpty()) {
        setResult(RESULT_CANCELED)
        finish()
        return
      }

      val resultIntent = Intent()
        .apply {
          putExtra(SESSION_SECRET_KEY, sessionSecret)
        }

      setResult(RESULT_OK, resultIntent)
      finish()
    }
  }

  private fun openWebBrowserAsync(startUrl: String) {
    val intent = createCustomTabsIntent().apply {
      data = startUrl.toUri()
    }

    startActivity(intent)
  }

  private fun createCustomTabsIntent(): Intent {
    val builder = CustomTabsIntent.Builder()
    builder.setShowTitle(false)

    return builder
      .build()
      .intent
      .apply {
        // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
        putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, false)
      }
  }

  private fun createAuthUrl(type: AuthRequestType): String {
    return "${WEBSITE_ORIGIN}/${type.type}?confirm_account=1&app_redirect_uri=${
      URLEncoder.encode(
        REDIRECT_BASE,
        "UTF-8"
      )
    }"
  }
}
