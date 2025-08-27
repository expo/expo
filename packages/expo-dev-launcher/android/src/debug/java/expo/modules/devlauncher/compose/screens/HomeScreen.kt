package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import com.composables.core.rememberDialogState
import com.composeunstyled.Button
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeState
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.AppLoadingErrorDialog
import expo.modules.devlauncher.compose.ui.DevelopmentSessionActions
import expo.modules.devlauncher.compose.ui.DevelopmentSessionSection
import expo.modules.devlauncher.compose.ui.RunningAppCard
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Spacer
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
  val hasPackager = state.runningPackagers.isNotEmpty()
  val errorDialogState = rememberDialogState(initiallyVisible = false)
  val scrollState = rememberScrollState()

  LaunchedEffect(state.loadingError) {
    if (state.loadingError != null) {
      errorDialogState.visible = true
    }
  }

  LaunchedEffect(errorDialogState.visible) {
    if (!errorDialogState.visible) {
      onAction(HomeAction.ClearLoadingError)
    }
  }

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
        NewText(
          "DEVELOPMENT SERVERS",
          style = NewAppTheme.font.sm.merge(
            fontWeight = FontWeight.Medium,
            fontFamily = NewAppTheme.font.mono
          ),
          color = NewAppTheme.colors.text.quaternary
        )

        NewText(
          "INFO",
          style = NewAppTheme.font.sm.merge(
            fontWeight = FontWeight.Medium,
            fontFamily = NewAppTheme.font.mono
          ),
          color = NewAppTheme.colors.text.link,
          modifier = Modifier.clickable(
            interactionSource = null,
            indication = null,
            onClick = {
              onDevServersClick()
            }
          )
        )
      }

      Spacer(NewAppTheme.spacing.`3`)

      if (hasPackager) {
        Column(
          verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
        ) {
          for (packager in state.runningPackagers) {
            RunningAppCard(
              appIp = packager.url,
              appName = packager.description
            ) {
              onAction(HomeAction.OpenApp(packager.url))
            }
          }
        }

        Spacer(NewAppTheme.spacing.`2`)

        Accordion(
          "New development server",
          initialState = false,
          modifier = Modifier
            .fillMaxWidth()
        ) {
          DevelopmentSessionActions(state.isFetchingPackagers, onAction)
        }
      } else {
        DevelopmentSessionSection(state.isFetchingPackagers, onAction)
      }

      if (state.recentlyOpenedApps.isNotEmpty()) {
        Spacer(NewAppTheme.spacing.`6`)

        Row(
          horizontalArrangement = Arrangement.SpaceBetween,
          modifier = Modifier.fillMaxWidth()
        ) {
          NewText(
            "RECENTLY OPENED",
            style = NewAppTheme.font.sm.merge(
              fontWeight = FontWeight.Medium,
              fontFamily = NewAppTheme.font.mono
            ),
            color = NewAppTheme.colors.text.quaternary
          )

          NewText(
            "RESET",
            style = NewAppTheme.font.sm.merge(
              fontWeight = FontWeight.Medium,
              fontFamily = NewAppTheme.font.mono
            ),
            color = NewAppTheme.colors.text.link,
            modifier = Modifier.clickable(
              interactionSource = null,
              indication = null,
              onClick = {
                onAction(HomeAction.ResetRecentlyOpenedApps)
              }
            )
          )
        }

        Spacer(NewAppTheme.spacing.`3`)

        Column(
          verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)
        ) {
          for (packager in state.recentlyOpenedApps) {
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
          )
        )
      ),
      onAction = {},
      onProfileClick = {},
      onDevServersClick = {}
    )
  }
}
