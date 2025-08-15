package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import expo.modules.devlauncher.compose.DefaultScreenContainer
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.utils.copyToClipboard
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date

@Composable
fun Modifier.verticalScrollbar(
  scrollState: ScrollState,
  width: Dp = 6.dp,
  scrollBarColor: Color = Color.LightGray,
  endPadding: Float = 12f
): Modifier {
  return drawWithContent {
    drawContent()

    val viewportHeight = this.size.height
    val totalContentHeight = scrollState.maxValue.toFloat() + viewportHeight
    val scrollValue = scrollState.value.toFloat()

    val scrollBarHeight =
      (viewportHeight / totalContentHeight) * viewportHeight
    val scrollBarStartOffset =
      (scrollValue / totalContentHeight) * viewportHeight

    drawRoundRect(
      color = scrollBarColor,
      topLeft = Offset(this.size.width - endPadding, scrollBarStartOffset),
      size = Size(width.toPx(), scrollBarHeight)
    )
  }
}

@Composable
fun Modifier.horizontalScrollbar(
  scrollState: ScrollState,
  width: Dp = 6.dp,
  scrollBarColor: Color = Color.LightGray,
  endPadding: Float = 12f
): Modifier {
  return drawWithContent {
    drawContent()

    val viewportWidth = this.size.width
    val totalContentWidth = scrollState.maxValue.toFloat() + viewportWidth
    val scrollValue = scrollState.value.toFloat()

    val scrollBarHeight =
      (viewportWidth / totalContentWidth) * viewportWidth
    val scrollBarStartOffset =
      (scrollValue / totalContentWidth) * viewportWidth

    drawRoundRect(
      color = scrollBarColor,
      topLeft = Offset(scrollBarStartOffset, this.size.height - endPadding),
      size = Size(scrollBarHeight, width.toPx())
    )
  }
}

@Composable
fun StackTrace(
  stack: String,
  modifier: Modifier = Modifier
) {
  val verticalScrollState = rememberScrollState()
  val horizontalScrollState = rememberScrollState()
  Box(
    modifier = Modifier
      .verticalScrollbar(verticalScrollState)
      .horizontalScrollbar(horizontalScrollState)
      .then(modifier)
  ) {
    Box(
      Modifier
        .verticalScroll(verticalScrollState)
        .horizontalScroll(horizontalScrollState)

    ) {
      Box(modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)) {
        NewText(
          stack,
          style = TextStyle.Default.merge(
            lineHeight = 16.sp,
            fontSize = 10.sp,
            fontFamily = NewAppTheme.font.mono,
            fontWeight = FontWeight.Light
          )
        )
      }
    }
  }
}

@Composable
fun CrashReportScreen(
  timestamp: Long,
  message: String,
  stack: String
) {
  val context = LocalContext.current

  Column(
    modifier = Modifier.safeDrawingPadding()
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`4`),
      modifier = Modifier
        .padding(horizontal = NewAppTheme.spacing.`4`)
        .padding(top = NewAppTheme.spacing.`4`)
    ) {
      ActionButton(
        "Tap to Copy Report",
        foreground = NewAppTheme.colors.buttons.primary.foreground,
        background = NewAppTheme.colors.buttons.primary.background,
        modifier = Modifier
          .padding(vertical = NewAppTheme.spacing.`2`),
        onClick = {
          copyToClipboard(
            context,
            label = "Crash Report",
            text = run {
              val json = JSONObject().apply {
                put("timestamp", timestamp)
                put("message", message)
                put("stack", stack)
              }

              json.toString(2)
            }
          )
        }
      )

      Column(verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)) {
        NewText(
          "Occurred:",
          style = NewAppTheme.font.lg.merge(
            fontWeight = FontWeight.Medium
          )
        )

        NewText(
          SimpleDateFormat.getDateTimeInstance().format(Date(timestamp)).toString(),
          style = NewAppTheme.font.md,
          color = NewAppTheme.colors.text.secondary
        )
      }

      Column(verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)) {
        NewText(
          "Reason:",
          style = NewAppTheme.font.lg.merge(
            fontWeight = FontWeight.Medium
          )
        )

        NewText(
          message,
          style = NewAppTheme.font.md,
          color = NewAppTheme.colors.text.secondary
        )
      }
    }

    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
      modifier = Modifier.padding(top = NewAppTheme.spacing.`4`)
    ) {
      NewText(
        "Stack Trace:",
        style = NewAppTheme.font.lg.merge(
          fontWeight = FontWeight.Medium
        ),
        modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)
      )

      StackTrace(stack)
    }
  }
}

@Composable
@Preview(showBackground = true)
fun CrashReportScreenPreview() {
  DefaultScreenContainer {
    CrashReportScreen(
      timestamp = 1633036800000L,
      message = "Sample crash message",
      stack = "java.lang.RuntimeException: Sample exception\n\tat com.example.app.MainActivity.onCreate(MainActivity.java:23)\n\tat android.app.Activity.performCreate(Activity.java:8000)\n\tat android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3500)\n\tat android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:3600)\n\tat android.app.servertransaction.LaunchActivityItem.execute(LaunchActivityItem.java:85)\n\tat android.app.servertransaction.TransactionExecutor.executeCallbacks(TransactionExecutor.java:135)\n\tat android.app.servertransaction.TransactionExecutor.execute(TransactionExecutor.java:95)\n\tat android.app.ActivityThread.handleMessage(ActivityThread.java:2200)\n\tat android.os.Handler.dispatchMessage(Handler.java:106)\n\tat android.os.Looper.loop(Looper.java:223)\n\tat android.app.ActivityThread.main(ActivityThread.java:7656)\n\tat java.lang.reflect.Method.invoke(Native Method)\n\tat com.android.internal.os.RuntimeInit.run(RuntimeInit.java:592)\n\tat com.android.internal.os.ZygoteInit.main(ZygoteInit.java:947)"
    )
  }
}
