package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composables.core.Dialog
import com.composables.core.DialogPanel
import com.composables.core.DialogState
import com.composables.core.Scrim
import com.composables.core.rememberDialogState
import com.composeunstyled.Button
import com.composeunstyled.Icon
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeState
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.AppLoadingErrorDialog
import expo.modules.devlauncher.compose.ui.DevelopmentSessionHelper
import expo.modules.devlauncher.compose.ui.RunningAppCard
import expo.modules.devlauncher.compose.ui.ServerUrlInput
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devlauncher.services.PackagerInfo
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.pulseEffect
import expo.modules.devmenu.compose.ui.Warning
import kotlinx.coroutines.delay
import kotlin.time.Clock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

@Composable
fun HowToStartDevelopmentServerDialog(dialogState: DialogState) {
  Dialog(state = dialogState) {
    Scrim()

    DialogPanel(
      modifier = Modifier
        .displayCutoutPadding()
        .systemBarsPadding()
        .padding(horizontal = NewAppTheme.spacing.`3`)
        .clip(RoundedCornerShape(NewAppTheme.borderRadius.xl))
        .background(NewAppTheme.colors.background.default)
    ) {
      Column {
        RowLayout(
          rightComponent = {
            Button(onClick = {
              dialogState.visible = false
            }) {
              DayNighIcon(
                id = R.drawable.x_icon,
                contentDescription = "Close dialog"
              )
            }
          },
          modifier = Modifier.padding(NewAppTheme.spacing.`3`)
        ) {
          Heading("Development servers")
        }

        Divider()

        Row(modifier = Modifier.padding(NewAppTheme.spacing.`3`)) {
          DevelopmentSessionHelper()
        }
      }
    }
  }
}

@Composable
fun CrashReport(
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
  onProfileClick: () -> Unit
) {
  val hasPackager = state.runningPackagers.isNotEmpty()
  val howToStartDevelopmentDialogState = rememberDialogState(initiallyVisible = false)
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

  HowToStartDevelopmentServerDialog(howToStartDevelopmentDialogState)

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
          modifier = Modifier.clickable {
            howToStartDevelopmentDialogState.visible = true
          }
        )
      }

      Spacer(NewAppTheme.spacing.`3`)

      if (hasPackager) {
        Column(
          verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)
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
      } else {
        DevelopmentSessionHelper()
        Spacer(NewAppTheme.spacing.`2`)
      }

      val isFetching = state.isFetchingPackagers
      var isFetchingUIState by remember { mutableStateOf(isFetching) }
      var fetchStartTime by remember { mutableStateOf<Instant?>(null) }

      LaunchedEffect(isFetching) {
        if (isFetching) {
          isFetchingUIState = true
          fetchStartTime = Clock.System.now()
          return@LaunchedEffect
        }

        if (!isFetchingUIState) {
          return@LaunchedEffect
        }

        val startTime = fetchStartTime
        if (startTime == null) {
          isFetchingUIState = false
          return@LaunchedEffect
        }

        val elapsedTime = startTime - Clock.System.now()
        val remainingTime = 2.seconds - elapsedTime

        delay(remainingTime)

        isFetchingUIState = state.isFetchingPackagers
      }

      Button(
        onClick = {
          onAction(HomeAction.RefetchRunningApps)
        },
        enabled = !isFetchingUIState
      ) {
        Row(
          horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 12.dp)
        ) {
          Icon(
            painter = painterResource(R.drawable.signal),
            contentDescription = "Signal Icon",
            tint = NewAppTheme.colors.text.link,
            modifier = Modifier
              .size(16.dp)
              .then(
                if (isFetchingUIState) {
                  Modifier.pulseEffect(
                    initialScale = 0.2f,
                    brush = SolidColor(NewAppTheme.colors.text.link.copy(alpha = 0.4f))
                  )
                } else {
                  Modifier
                }
              )
          )

          NewText(
            if (isFetchingUIState) {
              "Searching for development servers..."
            } else {
              "Fetch development servers"
            },
            style = NewAppTheme.font.sm,
            color = NewAppTheme.colors.text.link
          )
        }
      }

      if (!EmulatorUtilities.isRunningOnEmulator()) {
        Button(
          onClick = {
            onAction(HomeAction.ScanQRCode)
          }
        ) {
          Row(
            horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
              .fillMaxWidth()
              .padding(vertical = 12.dp)
          ) {
            Icon(
              painter = painterResource(R.drawable.scan),
              contentDescription = "QR code",
              tint = NewAppTheme.colors.text.link,
              modifier = Modifier
                .size(16.dp)
            )

            NewText(
              "Scan QR code",
              style = NewAppTheme.font.sm,
              color = NewAppTheme.colors.text.link
            )
          }
        }
      }

      Accordion(
        "Enter URL manually",
        initialState = false,
        modifier = Modifier
          .fillMaxWidth()
          .padding(vertical = 12.dp)
      ) {
        Column {
          Spacer(NewAppTheme.spacing.`1`)
          ServerUrlInput(
            openApp = { urlValue ->
              onAction(HomeAction.OpenApp(urlValue))
            }
          )
        }
      }

      if (state.recentlyOpenedApps.isNotEmpty()) {
        Spacer(NewAppTheme.spacing.`6`)

        Row(
          horizontalArrangement = Arrangement.SpaceBetween,
          modifier = Modifier.fillMaxWidth()
        ) {
          NewText(
            "RECENTLY OPEND",
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
            modifier = Modifier.clickable {
              onAction(HomeAction.ResetRecentlyOpenedApps)
            }
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
      onProfileClick = {}
    )
  }
}
