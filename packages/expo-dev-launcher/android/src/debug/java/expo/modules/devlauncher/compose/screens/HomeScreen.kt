package expo.modules.devlauncher.compose.screens

import android.util.Log
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.displayCutoutPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
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
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.models.HomeState
import expo.modules.devlauncher.compose.primitives.Accordion
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.DevelopmentSessionHelper
import expo.modules.devlauncher.compose.ui.RunningAppCard
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devlauncher.compose.ui.SectionHeader
import expo.modules.devlauncher.compose.ui.ServerUrlInput
import expo.modules.devlauncher.compose.utils.withIsLast
import expo.modules.devlauncher.launcher.DevLauncherAppEntry
import expo.modules.devlauncher.launcher.errors.DevLauncherErrorInstance
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Divider
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.RowLayout
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.primitives.pulseEffect
import expo.modules.devmenu.compose.theme.Theme
import kotlinx.coroutines.delay
import kotlin.time.Clock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.ExperimentalTime
import kotlin.time.Instant
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue

@Composable
fun HowToStartDevelopmentServerDialog(dialogState: DialogState) {
  Dialog(state = dialogState) {
    Scrim()

    DialogPanel(
      modifier = Modifier
        .displayCutoutPadding()
        .systemBarsPadding()
        .clip(RoundedCornerShape(12.dp))
        .background(Theme.colors.background.default)
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
          modifier = Modifier.padding(Theme.spacing.medium)
        ) {
          Heading("Development servers")
        }

        Divider()

        Row(modifier = Modifier.padding(Theme.spacing.medium)) {
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

  Spacer(Theme.spacing.large)

  RoundedSurface {
    Button(onClick = {
      onClick(crashReport)
    }) {
      Text(
        "The last time you tried to open an app the development build crashed. Tap to get more information.",
        modifier = Modifier.padding(Theme.spacing.medium)
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
  val dialogState = rememberDialogState(initiallyVisible = false)
  val scrollState = rememberScrollState()

  HowToStartDevelopmentServerDialog(dialogState)

  Column {
    ScreenHeaderContainer(modifier = Modifier.padding(Theme.spacing.medium)) {
      AppHeader(
        appName = state.appName,
        currentAccount = state.currentAccount,
        onProfileClick = onProfileClick
      )
    }

    Column(
      modifier = Modifier
        .verticalScroll(scrollState)
        .padding(horizontal = Theme.spacing.medium)
    ) {
      val crashReport = state.crashReport
      CrashReport(
        crashReport = crashReport,
        onClick = {
          onAction(HomeAction.NavigateToCrashReport(it))
        }
      )

      Spacer(Theme.spacing.large)

      Row {
        Spacer(Theme.spacing.small)

        SectionHeader(
          "Development servers",
          leftIcon = {
            Image(
              painter = painterResource(R.drawable.terminal_icon),
              contentDescription = "Terminal Icon"
            )
          },
          rightIcon = {
            if (hasPackager) {
              Row {
                Button(onClick = {
                  dialogState.visible = true
                }) {
                  Theme.colors.icon
                  DayNighIcon(
                    id = R.drawable.info_icon,
                    contentDescription = "Info Icon"
                  )
                }

                Spacer(Theme.spacing.small)
              }
            }
          }
        )
      }

      Spacer(Theme.spacing.small)

      RoundedSurface {
        Column {
          if (hasPackager) {
            for (packager in state.runningPackagers) {
              RunningAppCard(
                appIp = packager.url,
                appName = packager.description
              ) {
                onAction(HomeAction.OpenApp(packager.url))
              }
              Divider()
            }
          } else {
            Box(modifier = Modifier.padding(Theme.spacing.medium)) {
              DevelopmentSessionHelper()
            }
            Divider()
          }

          val infoColor = Theme.colors.status.info
          val defaultColor = Theme.colors.status.default
          val isFetching = state.isFetchingPackagers
          var isFetchingUIState by remember { mutableStateOf(isFetching) }
          var fetchStartTime by remember { mutableStateOf<Instant?>(null) }

          LaunchedEffect(isFetching) {
            Log.e("DevLauncher", "isFetchingPackagers changed: $isFetching")
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

            if (!state.isFetchingPackagers) {
              isFetchingUIState = false
            }
          }

          Button(
            onClick = {
              onAction(HomeAction.RefetchRunningApps)
            },
            enabled = !isFetchingUIState
          ) {
            RowLayout(
              modifier = Modifier.padding(Theme.spacing.medium),
              leftComponent = {
                Box(
                  modifier = Modifier
                    .size(Theme.spacing.small)
                    .drawBehind {
                      drawCircle(
                        color = defaultColor,
                        radius = size.minDimension / 2f
                      )
                    }
                    .then(
                      if (isFetchingUIState) {
                        Modifier.pulseEffect(
                          initialScale = 0.95f,
                          targetScale = 2f,
                          brush = SolidColor(infoColor)
                        )
                      } else {
                        Modifier
                      }
                    )
                )
              }
            ) {
              Text(
                if (isFetchingUIState) {
                  "Searching for development servers..."
                } else {
                  "Fetch development servers"
                }
              )
            }
          }

          Divider()

          Accordion("Enter URL manually", initialState = false) {
            Column {
              Spacer(Theme.spacing.tiny)

              ServerUrlInput(
                openApp = { urlValue ->
                  onAction(HomeAction.OpenApp(urlValue))
                }
              )

              Spacer(Theme.spacing.small)
            }
          }
        }
      }

      if (state.recentlyOpenedApps.isNotEmpty()) {
        Spacer(Theme.spacing.large)

        Row {
          Spacer(Theme.spacing.small)

          SectionHeader(
            "Recently",
            rightIcon = {
              Row {
                Button(onClick = {
                  onAction(HomeAction.ResetRecentlyOpenedApps)
                }) {
                  Text(
                    "Reset",
                    color = Theme.colors.text.secondary,
                    fontSize = Theme.typography.small,
                    fontWeight = FontWeight.Bold
                  )
                }

                Spacer(Theme.spacing.small)
              }
            }
          )
        }

        Spacer(Theme.spacing.small)

        RoundedSurface {
          Column {
            for ((packager, isLast) in state.recentlyOpenedApps.withIsLast()) {
              val url = packager.url
              val description = packager.name

              RunningAppCard(
                appIp = url,
                appName = description
              ) {
                onAction(HomeAction.OpenApp(url))
              }

              if (!isLast) {
                Divider()
              }
            }
          }
        }
      }

      Spacer(Theme.spacing.large)
    }
  }
}

@Preview(showBackground = true)
@Composable
fun HomeScreenPreview() {
  HomeScreen(
    state = HomeState(
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
