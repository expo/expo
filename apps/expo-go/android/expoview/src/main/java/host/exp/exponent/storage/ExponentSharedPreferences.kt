// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.storage

import android.content.Context
import host.exp.exponent.analytics.EXL
import host.exp.exponent.kernel.ExperienceKey
import host.exp.expoview.ExpoViewBuildConfig
import host.exp.expoview.R
import org.json.JSONException
import org.json.JSONObject
import javax.inject.Singleton

@Singleton
class ExponentSharedPreferences(val context: Context) {
    private val sharedPreferences = context.getSharedPreferences(
        context.getString(R.string.preference_file_key),
        Context.MODE_PRIVATE
    )

    private val exponentInstallationId = ExponentInstallationId(context, sharedPreferences)

    fun getBoolean(key: ExponentSharedPreferencesKey) =
        sharedPreferences.getBoolean(key.preferenceKey, DEFAULT_VALUES[key] ?: false)

    fun getBoolean(key: ExponentSharedPreferencesKey, defaultValue: Boolean) =
        sharedPreferences.getBoolean(key.preferenceKey, defaultValue)

    fun setBoolean(key: ExponentSharedPreferencesKey, value: Boolean) =
        sharedPreferences.edit().putBoolean(key.preferenceKey, value).apply()

    fun getInteger(key: ExponentSharedPreferencesKey) = getInteger(key, 0)

    private fun getInteger(key: ExponentSharedPreferencesKey, defaultValue: Int) =
        sharedPreferences.getInt(key.preferenceKey, defaultValue)

    fun setInteger(key: ExponentSharedPreferencesKey, value: Int) =
        sharedPreferences.edit().putInt(key.preferenceKey, value).apply()

    fun getLong(key: ExponentSharedPreferencesKey) =
        sharedPreferences.getLong(key.preferenceKey, 0)

    fun setLong(key: ExponentSharedPreferencesKey, value: Long) =
        sharedPreferences.edit().putLong(key.preferenceKey, value).apply()

    fun getString(key: ExponentSharedPreferencesKey) =
        getString(key, null)

    fun getString(key: ExponentSharedPreferencesKey, defaultValue: String?) =
        sharedPreferences.getString(key.preferenceKey, defaultValue)

    fun setString(key: ExponentSharedPreferencesKey, value: String?) =
        sharedPreferences.edit().putString(key.preferenceKey, value).apply()

    fun delete(key: ExponentSharedPreferencesKey) =
        sharedPreferences.edit().remove(key.preferenceKey).apply()

    fun shouldUseEmbeddedKernel() =
        getBoolean(ExponentSharedPreferencesKey.USE_EMBEDDED_KERNEL_KEY)

    fun getUUID(): String? = exponentInstallationId.getUUID()

    fun getOrCreateUUID(): String = exponentInstallationId.getOrCreateUUID()

    fun updateSession(session: JSONObject) =
        setString(ExponentSharedPreferencesKey.EXPO_AUTH_SESSION, session.toString())

    fun removeSession() = setString(ExponentSharedPreferencesKey.EXPO_AUTH_SESSION, null)

    val sessionSecret: String?
        get() {
            val sessionString = getString(ExponentSharedPreferencesKey.EXPO_AUTH_SESSION)
                ?: return null
            return try {
                val session = JSONObject(sessionString)
                session.getString(EXPO_AUTH_SESSION_SECRET_KEY)
            } catch (e: Exception) {
                EXL.e(TAG, e)
                null
            }
        }

    fun removeLegacyManifest(manifestUrl: String) =
        sharedPreferences.edit().remove(manifestUrl).apply()

    fun updateExperienceMetadata(experienceKey: ExperienceKey, metadata: JSONObject) =
        sharedPreferences.edit()
            .putString(EXPERIENCE_METADATA_PREFIX + experienceKey.scopeKey, metadata.toString())
            .apply()

    fun getExperienceMetadata(experienceKey: ExperienceKey): JSONObject? {
        val jsonString =
            sharedPreferences.getString(EXPERIENCE_METADATA_PREFIX + experienceKey.scopeKey, null)
                ?: return null
        return try {
            JSONObject(jsonString)
        } catch (e: JSONException) {
            EXL.e(TAG, e)
            null
        }
    }

    companion object {
        private val TAG = ExponentSharedPreferences::class.java.simpleName

        const val EXPO_AUTH_SESSION_SECRET_KEY = "sessionSecret"

        // Metadata
        const val EXPERIENCE_METADATA_PREFIX = "experience_metadata_"
        const val EXPERIENCE_METADATA_UNREAD_REMOTE_NOTIFICATIONS = "unreadNotifications"
        const val EXPERIENCE_METADATA_ALL_NOTIFICATION_IDS = "allNotificationIds"
        const val EXPERIENCE_METADATA_ALL_SCHEDULED_NOTIFICATION_IDS = "allScheduledNotificationIds"
        const val EXPERIENCE_METADATA_LOADING_ERROR = "loadingError"
        const val EXPERIENCE_METADATA_PERMISSIONS = "permissions"
        const val EXPERIENCE_METADATA_NOTIFICATION_CHANNELS = "notificationChannels"

        private val DEFAULT_VALUES = mutableMapOf(
            ExponentSharedPreferencesKey.USE_EMBEDDED_KERNEL_KEY to ExpoViewBuildConfig.USE_EMBEDDED_KERNEL,
            ExponentSharedPreferencesKey.IS_ONBOARDING_FINISHED_KEY to false,
            ExponentSharedPreferencesKey.NUX_HAS_FINISHED_FIRST_RUN_KEY to false,
            ExponentSharedPreferencesKey.SHOULD_NOT_USE_KERNEL_CACHE to false
        )
    }

    init {
        // We renamed `nux` to `onboarding` in January 2020 - the old preference key can be removed from here after some time,
        // but since then we need to rewrite nux setting to the new key.
        if (!sharedPreferences.contains(ExponentSharedPreferencesKey.IS_ONBOARDING_FINISHED_KEY.preferenceKey)) {
            setBoolean(
                ExponentSharedPreferencesKey.IS_ONBOARDING_FINISHED_KEY,
                getBoolean(ExponentSharedPreferencesKey.NUX_HAS_FINISHED_FIRST_RUN_KEY)
            )
        }
    }

    enum class ExponentSharedPreferencesKey(val preferenceKey: String) {
        // Dev options
        USE_EMBEDDED_KERNEL_KEY("use_embedded_kernel"),

        // Other
        FCM_TOKEN_KEY("fcm_token"),
        REFERRER_KEY("referrer"),
        NUX_HAS_FINISHED_FIRST_RUN_KEY("nux_has_finished_first_run"),
        IS_ONBOARDING_FINISHED_KEY("is_onboarding_finished"),
        LAST_FATAL_ERROR_DATE_KEY("last_fatal_error_date_key"),
        SHOULD_NOT_USE_KERNEL_CACHE("should_not_use_kernel_cache"),
        KERNEL_REVISION_ID("kernel_revision_id"),
        EXPO_AUTH_SESSION("expo_auth_session"),
        OKHTTP_CACHE_VERSION_KEY("okhttp_cache_version")
    }
}
