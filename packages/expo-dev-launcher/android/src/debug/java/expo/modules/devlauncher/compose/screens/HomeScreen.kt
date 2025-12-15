package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeState
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.AppLoadingErrorDialog
import expo.modules.devlauncher.compose.ui.DevelopmentSessionActions
import expo.modules.devlauncher.compose.ui.DevelopmentSessionSection
import expo.modules.devlauncher.compose.ui.RunningAppCard
import expo.modules.devlauncher.compose.ui.rememberAppLoadingErrorDialogState
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.ui.Section
import expo.modules.devmenu.compose.ui.Warning
import kotlin.time.ExperimentalTime

@Composable
private fun CrashReport(
  crashReport: DevLauncherErrorInstance?,
  onClick: (report: DevLauncherErrorInstance) -> Unit = {}
) {
  if (crashReport == null) {
    return
  }

  Row(modifier = Modifier.padding(top = NewAppTheme.spacing.`6` - NewAppTheme.spacing.`4`)) {
    Button(onClick = {
      onClick(crashReport)
    }) {
      Warning(
        "The last time you tried to open an app the development build crashed. Tap to get more information."
      )
    }
  }
}

@OptIn(ExperimentalTime::class)
@Composable
fun HomeScreen(
  state: HomeState,
  onAction: (HomeAction) -> Unit,
  onProfileClick: () -> Unit,
  onDevServersClick: () -> Unit
) {
  val scrollState = rememberScrollState()
  val errorDialogState = rememberAppLoadingErrorDialogState(state, onAction)

  AppLoadingErrorDialog(
    errorDialogState,
    currentError = state.loadingError
  )

  Column(
    modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)
  ) {
    AppHeader(
      onProfileClick = onProfileClick,
      modifier = Modifier.padding(vertical = NewAppTheme.spacing.`4`)
    )

    val crashReport = state.crashReport
    CrashReport(
      crashReport = crashReport,
      onClick = {
        onAction(HomeAction.NavigateToCrashReport(it))
      }
    )

    Column(
      modifier = Modifier
        .padding(vertical = NewAppTheme.spacing.`6`)
        .verticalScroll(scrollState)
    ) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        modifier = Modifier.fillMaxWidth()
      ) {
        Section.Header("DEVELOPMENT SERVERS")

        Section.Button("INFO", onDevServersClick)
      }

      Spacer(NewAppTheme.spacing.`3`)

      val runningPackagers = state.runningPackagers
      if (runningPackagers.isNotEmpty()) {
        LocalPackagers(
          state.isFetchingPackagers,
          runningPackagers,
          onAction
        )
      } else {
        DevelopmentSessionSection(state.isFetchingPackagers, onAction)
      }

      Spacer(NewAppTheme.spacing.`6`)

      RecentlyOpenedApps(
        state.recentlyOpenedApps,
        onAction
      )
    }
  }
}

@Composable
private fun LocalPackagers(
  isFetchingPackagers: Boolean,
  runningPackagers: Set<PackagerInfo>,
  onAction: (HomeAction) -> Unit
) {
  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
    ) {
      for (packager in runningPackagers) {
        RunningAppCard(
          appIp = packager.url,
          appName = packager.description
        ) {
          onAction(HomeAction.OpenApp(packager.url))
        }
      }
    }

    Accordion(
      "New development server",
      initialState = false,
      modifier = Modifier
        .fillMaxWidth()
    ) {
      DevelopmentSessionActions(isFetchingPackagers, onAction)
    }
  }
}

@Composable
private fun RecentlyOpenedApps(
  recentlyOpenedApps: List<DevLauncherAppEntry>,
  onAction: (HomeAction) -> Unit
) {
  if (recentlyOpenedApps.isEmpty()) {
    return
  }

  Column(
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`)
  ) {
    Row(
      horizontalArrangement = Arrangement.SpaceBetween,
      modifier = Modifier.fillMaxWidth()
    ) {
      Section.Header("RECENTLY OPENED")

      Section.Button("RESET", onClick = { onAction(HomeAction.ResetRecentlyOpenedApps) })
    }

    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)
    ) {
      for (packager in recentlyOpenedApps) {
        RunningAppCard(
          appIp = packager.url,
          appName = packager.name
        ) {
          onAction(HomeAction.OpenApp(packager.url))
        }
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
  DefaultScreenContainer {
    HomeScreen(
      state = HomeState(
        runningPackagers = setOf(
          PackagerInfo(
            description = "BareExpo",
            url = "http://localhost:8081",
            isDevelopmentSession = true
          ),
          PackagerInfo(
            description = "Another App",
            url = "http://localhost:8081",
            isDevelopmentSession = true
          )
        ),
        recentlyOpenedApps = listOf(
          DevLauncherAppEntry(
            timestamp = 1752249592809L,
            name = "BareExpo",
            url = "http://10.0.2.2:8081",
            isEASUpdate = false,
            updateMessage = null,
            branchName = null
          ),
          DevLauncherAppEntry(
            timestamp = 1752249592809L,
            name = "BareExpo",
            url = "http://10.0.2.2:8081",
            isEASUpdate = false,
            updateMessage = null,
            branchName = null
          )
        )
      ),
      onAction = {},
      onProfileClick = {},
      onDevServersClick = {}
    )
  }
}
