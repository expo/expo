package host.exp.exponent.services

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import expo.modules.manifests.core.EmbeddedManifest
import expo.modules.manifests.core.ExpoUpdatesManifest
import expo.modules.manifests.core.Manifest
import host.exp.exponent.analytics.EXL
import host.exp.exponent.storage.ExponentSharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.util.Date
import javax.inject.Singleton

data class HistoryItem(
  val manifestUrl: String,
  val embeddedManifest: EmbeddedManifest? = null,
  val updatesManifest: ExpoUpdatesManifest? = null,
  val timestamp: Long = Date().time
) {
  val manifest: Manifest?
    get() = updatesManifest ?: embeddedManifest
}

@Singleton
class ExponentHistoryService constructor(
  val exponentSharedPreferences: ExponentSharedPreferences
) {
  private val _history = MutableStateFlow<List<HistoryItem>>(emptyList())
  val history = _history.asStateFlow()

  private val gson = Gson()

  init {
    loadHistory()
  }

  private fun loadHistory() {
    val jsonString =
      exponentSharedPreferences.getString(ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY)
    if (jsonString?.isNotBlank() == true) {
      try {
        val listType = object : TypeToken<List<HistoryItem>>() {}.type
        val items: List<HistoryItem> = gson.fromJson(jsonString, listType)
        _history.value = items.sortedByDescending { it.timestamp }
      } catch (e: Exception) {
        EXL.e(TAG, "Error parsing history from SharedPreferences: ${e.message}")
        clearHistory()
      }
    }
  }

  fun addHistoryItem(item: HistoryItem) {
    val currentHistory = _history.value.toMutableList()
    currentHistory.removeAll { it.manifestUrl == item.manifestUrl }
    currentHistory.add(0, item)
    _history.value = currentHistory
    saveHistory(currentHistory)
  }

  private fun saveHistory(history: List<HistoryItem>) {
    try {
      // Use Gson to serialize the list
      val jsonString = gson.toJson(history)
      exponentSharedPreferences.setString(
        ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY,
        jsonString
      )
    } catch (e: Exception) {
      EXL.e(TAG, "Error saving history to SharedPreferences with : ${e.message}")
    }
  }

  fun clearHistory() {
    _history.value = emptyList()
    exponentSharedPreferences.delete(ExponentSharedPreferences.ExponentSharedPreferencesKey.HISTORY)
  }

  companion object {
    private val TAG = ExponentHistoryService::class.java.simpleName
  }
}
