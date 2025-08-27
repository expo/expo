package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.models.HomeAction
import expo.modules.devlauncher.compose.primitives.CircularProgressBar
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import kotlinx.coroutines.delay
import kotlin.time.Clock
import kotlin.time.Duration.Companion.seconds
import kotlin.time.ExperimentalTime
import kotlin.time.Instant

@Composable
@OptIn(ExperimentalTime::class)
fun FetchDevelopmentServersButton(
  isFetching: Boolean,
  onAction: (HomeAction) -> Unit
) {
  // Users might spam the button, so after debouncing we need to get the current state.
  // We can't use `isFetching` directly in the `LaunchedEffect` as it would be captured in the lambda.
  var getCurrentState by remember { mutableStateOf({ isFetching }) }
  var isFetchingUIState by remember { mutableStateOf(isFetching) }
  var fetchStartTime by remember { mutableStateOf<Instant?>(null) }

  LaunchedEffect(isFetching) {
    getCurrentState = { isFetching }
  }

  LaunchedEffect(isFetching) {
    if (isFetching) {
      isFetchingUIState = true
      fetchStartTime = Clock.System.now()
      return@LaunchedEffect
    }

    val startTime = fetchStartTime
    if (startTime == null) {
      isFetchingUIState = false
      return@LaunchedEffect
    }

    val elapsedTime = Clock.System.now() - startTime
    val remainingTime = 2.seconds - elapsedTime

    delay(remainingTime)

    isFetchingUIState = getCurrentState()
  }

  RoundedSurface(
    color = NewAppTheme.colors.background.element,
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Button(
      onClick = {
        onAction(HomeAction.RefetchRunningApps)
      },
      enabled = !isFetchingUIState
    ) {
      Row(
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Companion.CenterVertically,
        modifier = Modifier.Companion
          .fillMaxWidth()
          .padding(NewAppTheme.spacing.`3`)
      ) {
        NewText(
          if (isFetchingUIState) {
            "Searching for development servers..."
          } else {
            "Fetch development servers"
          }
        )

        if (isFetchingUIState) {
          CircularProgressBar(size = 20.dp)
        } else {
          Icon(
            painter = painterResource(R.drawable.download),
            contentDescription = "Fetch development servers icon",
            tint = NewAppTheme.colors.icon.quaternary,
            modifier = Modifier
              .size(20.dp)
          )
        }
      }
    }
  }
}

@Preview(widthDp = 400)
@Composable
fun FetchDevelopmentServersButtonPreview() {
  FetchDevelopmentServersButton(
    isFetching = false,
    onAction = {}
  )
}
