package expo.modules.devlauncher.compose.models

import android.content.Context
import androidx.compose.runtime.mutableStateOf
import androidx.core.net.toUri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import expo.modules.devlauncher.DevLauncherController
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.services.ErrorRegistryService
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devlauncher.services.PackagerService
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

sealed interface HomeAction {
  class OpenApp(val url: String) : HomeAction
  object RefetchRunningApps : HomeAction
  object ResetRecentlyOpenedApps : HomeAction
  class NavigateToCrashReport(val crashReport: DevLauncherErrorInstance) : HomeAction
  object ScanQRCode : HomeAction
  object ClearLoadingError : HomeAction
}

data class HomeState(
  val runningPackagers: Set<PackagerInfo> = emptySet(),
  val isFetchingPackagers: Boolean = false,
  val recentlyOpenedApps: List<DevLauncherAppEntry> = emptyList(),
  val crashReport: DevLauncherErrorInstance? = null,
  val loadingError: String? = null
)

class HomeViewModel() : ViewModel() {
  val devLauncherController = inject<DevLauncherController>()
  val packagerService = inject<PackagerService>()
  val errorRegistryService = inject<ErrorRegistryService>()

  private var _state = mutableStateOf(
    HomeState(
      runningPackagers = packagerService.runningPackagers.value,
      recentlyOpenedApps = devLauncherController.getRecentlyOpenedApps(),
      crashReport = errorRegistryService.consumeException()
    )
  )

  val state
    get() = _state.value

  init {
    packagerService
      .runningPackagers
      .onEach { newPackagers ->
        _state.value = _state.value.copy(
          runningPackagers = newPackagers
        )
      }
      .launchIn(viewModelScope)

    packagerService.isLoading.onEach { isLoading ->
      _state.value = _state.value.copy(
        isFetchingPackagers = isLoading
      )
    }.launchIn(viewModelScope)
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

      HomeAction.RefetchRunningApps -> packagerService.refetchedPackager()

      HomeAction.ResetRecentlyOpenedApps -> viewModelScope.launch {
        devLauncherController.clearRecentlyOpenedApps()
        _state.value = _state.value.copy(recentlyOpenedApps = emptyList())
      }

      is HomeAction.ClearLoadingError -> _state.value = _state.value.copy(loadingError = null)

      is HomeAction.NavigateToCrashReport -> IllegalStateException("Navigation action should be handled by the UI layer, not the ViewModel.")

      is HomeAction.ScanQRCode -> IllegalStateException("QR code scanning should be handled by the UI layer, not the ViewModel.")
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
