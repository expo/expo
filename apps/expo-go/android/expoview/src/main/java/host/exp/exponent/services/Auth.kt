package host.exp.exponent.services

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import android.util.Log
import androidx.browser.customtabs.CustomTabsIntent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.platform.LocalContext
import java.net.URLEncoder
import java.nio.charset.StandardCharsets
import androidx.core.net.toUri
import androidx.core.util.remove

import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import androidx.core.content.edit
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

import host.exp.exponent.home.HistoryItem

const val redirectBase = "expauth://auth"
const val origin = "https://expo.dev"

fun getAuthSessionURL(urlPath: String): Uri {
    val encodedRedirect = URLEncoder.encode(redirectBase, StandardCharsets.UTF_8.toString())

    return "$origin/$urlPath?confirm_account=1&app_redirect_uri=$encodedRedirect".toUri()
}

// enum with strings login, signup
enum class AuthSessionType(val typeString: String) {
    LOGIN("login"),
    SIGNUP("signup")
}

fun launchAuthSession(
    context: Context,
    type: AuthSessionType,
    onAuthComplete: (String) -> Unit,
) {
    val customTabsIntent = CustomTabsIntent.Builder().build()
    customTabsIntent.launchUrl(context, getAuthSessionURL(type.typeString))
    PendingAuthSession.callback = onAuthComplete
}

object PendingAuthSession {
    var callback: ((String) -> Unit)? = null

    fun complete(callbackUri: Uri?) {
        // decode the token from the callbackUri
        val token = callbackUri?.getQueryParameter("session_secret")
        // Invoke the callback with the token
        if (token == null) {
            callback = null
            return
        }

        callback?.invoke(token)
        callback = null
    }
//
//    fun cancel() {
//        callback = null
//    }
}

class SessionRepository(context: Context) {
    private val sharedPreferences = context.getSharedPreferences("expo_session", Context.MODE_PRIVATE)

    companion object {
        private const val SESSION_SECRET_KEY = "session_secret"
        private const val SELECTED_ACCOUNT_ID_KEY = "selected_account_id"
        private const val RECENTS_KEY = "recents_history"
    }

    fun saveSessionSecret(secret: String?) {
        sharedPreferences.edit().putString(SESSION_SECRET_KEY, secret).apply()
    }

    fun getSessionSecret(): String? {
        return sharedPreferences.getString(SESSION_SECRET_KEY, null)
    }

    fun clearSessionSecret() {
        sharedPreferences.edit().remove(SESSION_SECRET_KEY).apply()
    }

    fun saveSelectedAccountId(accountId: String?) {
        sharedPreferences.edit().putString(SELECTED_ACCOUNT_ID_KEY, accountId).apply()
    }

    fun clearSelectedAccountId() {
        sharedPreferences.edit().remove(SELECTED_ACCOUNT_ID_KEY).apply()
    }

    fun getSelectedAccountId(): String? {
        return sharedPreferences.getString(SELECTED_ACCOUNT_ID_KEY, null)
    }

    fun saveRecents(recents: List<HistoryItem>) {
        val json = Gson().toJson(recents)
        sharedPreferences.edit {
            putString(RECENTS_KEY, json)
        }
    }

    fun getRecents(): List<HistoryItem> {
        val json = sharedPreferences.getString(RECENTS_KEY, null)
        if (json.isNullOrBlank()) {
            return emptyList()
        }
        val type = object : TypeToken<List<HistoryItem>>() {}.type
        return Gson().fromJson(json, type)
    }
}
