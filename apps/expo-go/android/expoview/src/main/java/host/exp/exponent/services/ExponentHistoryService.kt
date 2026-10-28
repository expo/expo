package host.exp.exponent.services

import android.util.Log
import com.google.gson.FormattingStyle
import com.google.gson.GsonBuilder
import com.google.gson.annotations.SerializedName
import com.google.gson.reflect.TypeToken
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import host.exp.exponent.storage.ExponentSharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Date
import javax.inject.Singleton

data class HistoryItem(
  @SerializedName("manifestUrl") val manifestUrl: String,
  @SerializedName("name") val name: String,
  @SerializedName("iconUrl") val iconUrl: String?,
  @SerializedName("timestamp") val timestamp: Long = Date().time
) {
  constructor(manifestUrl: String, manifest: Manifest) : this(
    manifestUrl = manifestUrl,
    name = manifest.getName() ?: manifestUrl,
    iconUrl = manifest.getIconUrl(),
    timestamp = Date().time
  )
}

@Singleton
class ExponentHistoryService(
  val exponentSharedPreferences: ExponentSharedPreferences
) {
  private val gson = GsonBuilder()
    .setFormattingStyle(FormattingStyle.COMPACT)
    .create()

  private val _history = MutableStateFlow(restoreHistory())
  val history = _history.asStateFlow()

  fun getLastCrashDate(): Long {
    return exponentSharedPreferences.getLong(ExponentSharedPreferences.ExponentSharedPreferencesKey.LAST_FATAL_ERROR_DATE_KEY)
  }

  fun addHistoryItem(item: HistoryItem) {
    val currentHistory = _history.value.toMutableList()
    currentHistory.removeAll { it.manifestUrl == item.manifestUrl }
    currentHistory.add(0, item)
    _history.value = currentHistory
    saveHistory(currentHistory)
  }

  private fun saveHistory(history: List<HistoryItem>) {
    runCatching {
      val jsonString = gson.toJson(history)
      exponentSharedPreferences.setString(
        ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY,
        jsonString
      )
    }.onFailure {
      EXL.e(TAG, "Error saving history to SharedPreferences with: ${it.message}")
    }
  }

  private fun restoreHistory(): List<HistoryItem> {
    val savedHistory = exponentSharedPreferences.getString(
      ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY
    ) ?: return emptyList()

    return runCatching {
      gson.fromJson(
        savedHistory,
        object : TypeToken<List<HistoryItem>>() {}
      )
    }.onFailure {
      Log.e(TAG, "Error restoring history from SharedPreferences with: ${it.message}")
      exponentSharedPreferences.delete(
        ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY
      )
    }.getOrNull()
      // Gson skips Kotlin null checks, so an item saved under other field names restores with nulls.
      ?.filter {
        @Suppress("SENSELESS_COMPARISON")
        (it.manifestUrl != null)
      }
      ?: emptyList()
  }

  fun clearHistory() {
    _history.value = emptyList()
    exponentSharedPreferences.delete(ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY)
  }

  companion object {
    private val TAG = ExponentHistoryService::class.java.simpleName
  }
}
