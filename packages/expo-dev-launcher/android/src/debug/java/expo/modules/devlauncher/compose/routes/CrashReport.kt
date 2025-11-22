package expo.modules.devlauncher.compose.routes

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.CrashReportModel
import expo.modules.devlauncher.compose.screens.CrashReportScreen
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import kotlinx.serialization.Serializable

@Serializable
class CrashReport(
  val timestamp: Long,
  val message: String,
  val stack: String
) {
  companion object {
    fun fromErrorInstance(errorInstance: DevLauncherErrorInstance): CrashReport {
      return CrashReport(
        timestamp = errorInstance.timestamp,
        message = errorInstance.throwable.message ?: "Unknown",
        stack = errorInstance.throwable.stackTraceToString()
      )
    }
  }
}

@Composable
fun CrashReportRoute() {
  DefaultScreenContainer {
    val viewModel = viewModel<CrashReportModel>()
    CrashReportScreen(
      timestamp = viewModel.state.timestamp,
      message = viewModel.state.message,
      stack = viewModel.state.stack
    )
  }
}
