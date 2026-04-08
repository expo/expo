package expo.modules.devlauncher.compose.models

import android.content.Context
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.services.ErrorRegistryService
import expo.modules.devlauncher.services.NsdPreferences
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devlauncher.services.PackagerService
import expo.modules.devlauncher.services.SessionService
import expo.modules.devlauncher.services.UserState
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

sealed interface HomeAction {
  class OpenApp(val url: String) : HomeAction
  object ResetRecentlyOpenedApps : HomeAction
  class NavigateToCrashReport(val crashReport: DevLauncherErrorInstance) : HomeAction
  object ScanQRCode : HomeAction
  object ClearLoadingError : HomeAction
  object RefreshServers : HomeAction
  object LoadEmbeddedBundle : HomeAction
}

data class HomeState(
  val runningPackagers: Set<PackagerInfo> = emptySet(),
  val recentlyOpenedApps: List<DevLauncherAppEntry> = emptyList(),
  val crashReport: DevLauncherErrorInstance? = null,
  val loadingError: String? = null,
  val isRefreshing: Boolean = false,
  val hasEmbeddedBundle: Boolean = false
)

class HomeViewModel : ViewModel(), DefaultLifecycleObserver {
  val devLauncherController = inject<DevLauncherController>()
  val packagerService = inject<PackagerService>()
  val errorRegistryService = inject<ErrorRegistryService>()
  private val nsdPreferences = inject<NsdPreferences>()
  private val sessionService = inject<SessionService>()

  private val appPackageName: String = devLauncherController.context.packageName

  private var allPackagers: Set<PackagerInfo> = packagerService.runningPackagers.value

  private var _state = mutableStateOf(
    HomeState(
      runningPackagers = filterPackagers(packagerService.runningPackagers.value),
      recentlyOpenedApps = devLauncherController.getRecentlyOpenedApps(),
      crashReport = errorRegistryService.consumeException(),
      hasEmbeddedBundle = devLauncherController.hasEmbeddedBundle()
    )
  )

  val state
    get() = _state.value

  private val nsdListener = {
    _state.value = _state.value.copy(
      runningPackagers = filterPackagers(allPackagers)
    )
  }

  init {
    packagerService
      .runningPackagers
      .onEach { newPackagers ->
        allPackagers = newPackagers
        _state.value = _state.value.copy(
          runningPackagers = filterPackagers(newPackagers)
        )
      }
      .launchIn(viewModelScope)

    packagerService.resumeHealthCheck()
    ProcessLifecycleOwner.get().lifecycle.addObserver(this)
    nsdPreferences.addOnChangeListener(nsdListener)

    sessionService
      .user
      .onEach {
        _state.value = _state.value.copy(
          runningPackagers = filterPackagers(allPackagers)
        )
      }
      .launchIn(viewModelScope)
  }

  override fun onResume(owner: LifecycleOwner) {
    packagerService.resumeHealthCheck()
  }

  override fun onPause(owner: LifecycleOwner) {
    packagerService.pauseHealthCheck()
  }

  override fun onCleared() {
    packagerService.pauseHealthCheck()
    ProcessLifecycleOwner.get().lifecycle.removeObserver(this)
    nsdPreferences.removeOnChangeListener(nsdListener)
  }

  private fun filterPackagers(packagers: Set<PackagerInfo>): Set<PackagerInfo> {
    var filtered = packagers

    if (nsdPreferences.filterByPackageName) {
      filtered = filtered.filter { it.androidPackage == appPackageName }.toSet()
    }

    val slugFilter = nsdPreferences.filterBySlug
    if (slugFilter.isNotBlank()) {
      filtered = filtered.filter { it.slug == slugFilter }.toSet()
    }

    if (nsdPreferences.filterByUsername) {
      val currentUsername = (sessionService.user.value as? UserState.LoggedIn)
        ?.data?.meUserActor?.username
      if (currentUsername != null) {
        filtered = filtered.filter { it.username == currentUsername }.toSet()
      }
    }

    return filtered
  }

  fun onAction(action: HomeAction) {
    when (action) {
      is HomeAction.OpenApp ->
        devLauncherController.coroutineScope.launch {
          try {
            devLauncherController.loadApp(action.url.toUri(), mainActivity = null)
          } catch (e: Exception) {
            _state.value = _state.value.copy(
              loadingError = e.message ?: "Unknown error"
            )
          }
        }

      HomeAction.ResetRecentlyOpenedApps -> viewModelScope.launch {
        devLauncherController.clearRecentlyOpenedApps()
        _state.value = _state.value.copy(recentlyOpenedApps = emptyList())
      }

      is HomeAction.ClearLoadingError -> _state.value = _state.value.copy(loadingError = null)

      is HomeAction.RefreshServers -> refreshServers()

      HomeAction.LoadEmbeddedBundle ->
        devLauncherController.coroutineScope.launch {
          try {
            devLauncherController.loadEmbeddedBundle()
          } catch (e: Exception) {
            _state.value = _state.value.copy(
              loadingError = e.message ?: "Failed to load embedded bundle"
            )
          }
        }

      is HomeAction.NavigateToCrashReport -> throw IllegalStateException("Navigation action should be handled by the UI layer, not the ViewModel.")

      is HomeAction.ScanQRCode -> throw IllegalStateException("QR code scanning should be handled by the UI layer, not the ViewModel.")
    }
  }

  private fun refreshServers() {
    if (_state.value.isRefreshing) return
    _state.value = _state.value.copy(isRefreshing = true)

    viewModelScope.launch {
      packagerService.restart()
      delay(2000)
      _state.value = _state.value.copy(isRefreshing = false)
    }
  }

  fun scanQRCode(context: Context, onResult: (String) -> Unit, onError: (String) -> Unit) {
    val options = GmsBarcodeScannerOptions.Builder()
      .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
      .build()

    val scanner = GmsBarcodeScanning.getClient(context, options)

    scanner.startScan()
      .addOnSuccessListener { barcode ->
        barcode.rawValue?.let {
          onResult(it)
        } ?: onError("No QR code data found")
      }
      .addOnCanceledListener {
        onError("Scanning cancelled")
      }
      .addOnFailureListener { exception ->
        onError("Scanning failed: ${exception.message ?: "Unknown error"}")
      }
  }
}
