package expo.modules.devlauncher.compose

import android.content.Context
import android.content.Intent
import android.content.Intent.ACTION_VIEW
import android.os.Bundle
import androidx.activity.result.contract.ActivityResultContract
import androidx.appcompat.app.AppCompatActivity
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.net.toUri
import expo.modules.devlauncher.launcher.DevLauncherActivity
import expo.modules.devlauncher.services.DependencyInjection
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

  private fun consumeAuthRedirect(intent: Intent?): Boolean {
    val data = intent?.data
    if (intent?.action != ACTION_VIEW || data?.scheme != "expo-dev-launcher" || data.host != "auth") {
      return false
    }
    val sessionSecret = data.getQueryParameter("session_secret")
    val userNameOrEmail = data.getQueryParameter("username_or_email")
    if (sessionSecret.isNullOrEmpty() || userNameOrEmail.isNullOrEmpty()) {
      setResult(RESULT_CANCELED)
    } else {
      DependencyInjection.sessionService?.setSession(Session(sessionSecret))
      setResult(
        RESULT_OK,
        Intent().apply {
          putExtra(SESSION_KEY, sessionSecret)
          putExtra(USERNAME_KEY, userNameOrEmail)
        }
      )
    }
    return true
  }

  var wasStarted = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    if (consumeAuthRedirect(intent)) {
      wasStarted = true // guard onResume's RESULT_CANCELED path on this instance
      startActivity(
        Intent(this, DevLauncherActivity::class.java)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      )
      finishAndRemoveTask()
      return
    }

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

    if (consumeAuthRedirect(intent)) {
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
