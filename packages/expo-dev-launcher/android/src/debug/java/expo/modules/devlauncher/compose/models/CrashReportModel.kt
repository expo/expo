package expo.modules.devlauncher.compose.models

import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.navigation.toRoute
import expo.modules.devlauncher.compose.routes.CrashReport

data class CrashReportState(
  val report: CrashReport
)

class CrashReportModel(
  savedStateHandle: SavedStateHandle
) : ViewModel() {
  private val _state = mutableStateOf(
    savedStateHandle.toRoute<CrashReport>()
  )

  val state
    get() = _state.value
}
