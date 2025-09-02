package expo.modules.devlauncher.compose

import android.content.Context
import android.content.Intent
import android.content.Intent.ACTION_VIEW
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContract
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.net.toUri
import java.net.URLEncoder

enum class AuthRequestType(val type: String) {
  LOGIN("login"),
  SIGNUP("signup");

  companion object {
    fun fromString(type: String): AuthRequestType {
      return entries.firstOrNull { it.type == type } ?: LOGIN
    }
  }
}

private const val SESSION_KEY = "session"
private const val USERNAME_KEY = "username"
private const val AUTH_REQUEST_TYPE_KEY = "auth_request_type"

private const val WEBSITE_ORIGIN = "https://expo.dev"
private const val REDIRECT_BASE = "expo-dev-launcher://auth"

sealed interface AuthResult {
  data class Success(val sessionSecret: String, val username: String) : AuthResult
  object Canceled : AuthResult
}

class AuthActivity : AppCompatActivity() {
  class Contract : ActivityResultContract<AuthRequestType, AuthResult>() {
    override fun createIntent(context: Context, input: AuthRequestType): Intent {
      return Intent(context, AuthActivity::class.java).apply {
        action = ACTION_VIEW
        putExtra(AUTH_REQUEST_TYPE_KEY, input.type)
      }
    }

    override fun parseResult(resultCode: Int, intent: Intent?): AuthResult {
      if (resultCode == RESULT_CANCELED || intent == null) {
        return AuthResult.Canceled
      }

      val sessionSecret = intent.getStringExtra(SESSION_KEY) ?: return AuthResult.Canceled
      val username = intent.getStringExtra(USERNAME_KEY) ?: return AuthResult.Canceled

      return AuthResult.Success(
        sessionSecret = sessionSecret,
        username = username
      )
    }
  }

  var wasStarted = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val extraType = intent.getStringExtra(AUTH_REQUEST_TYPE_KEY)
    if (extraType != null) {
      wasStarted = true
      openWebBrowserAsync(startUrl = createAuthUrl(type = AuthRequestType.fromString(extraType)))
    }
  }

  override fun onResume() {
    super.onResume()
    // onNewIntent will handle the response from the web browser
    if (intent?.data?.host == "expo-dev-launcher") {
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

    if (intent.action == ACTION_VIEW && intent.data?.scheme == "expo-dev-launcher" && intent.data?.host == "auth") {
      val sessionSecret = intent.data?.getQueryParameter("session_secret")
      val userNameOrEmail = intent.data?.getQueryParameter("username_or_email")

      if (sessionSecret.isNullOrEmpty() || userNameOrEmail.isNullOrEmpty()) {
        setResult(RESULT_CANCELED)
        finish()
        return
      }

      val resultIntent = Intent().apply {
        putExtra(SESSION_KEY, sessionSecret)
        putExtra(USERNAME_KEY, userNameOrEmail)
      }
      setResult(RESULT_OK, resultIntent)
      finish()
    }
  }

  private fun openWebBrowserAsync(startUrl: String) {
    requireNotNull(startUrl)

    val intent = createCustomTabsIntent()
    intent.data = startUrl.toUri()

    startActivity(intent)
  }

  private fun createCustomTabsIntent(): Intent {
    val builder = CustomTabsIntent.Builder()
    builder.setShowTitle(false)

    val intent = builder.build().intent

    // We cannot use builder's method enableUrlBarHiding, because there is no corresponding disable method and some browsers enables it by default.
    intent.putExtra(CustomTabsIntent.EXTRA_ENABLE_URLBAR_HIDING, false)

    return intent
  }

  private fun createAuthUrl(type: AuthRequestType): String {
    return "${WEBSITE_ORIGIN}/${type.type}?confirm_account=1&app_redirect_uri=${URLEncoder.encode(REDIRECT_BASE, "UTF-8")}"
  }
}
