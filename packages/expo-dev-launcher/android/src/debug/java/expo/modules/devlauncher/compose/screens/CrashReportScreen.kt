package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Mono
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme
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
  stack: String
) {
  val verticalScrollState = rememberScrollState()
  val horizontalScrollState = rememberScrollState()
  Box(modifier = Modifier.verticalScrollbar(verticalScrollState).horizontalScrollbar(horizontalScrollState)) {
    Box(
      Modifier
        .verticalScroll(verticalScrollState)
        .horizontalScroll(horizontalScrollState)
    ) {
      Box(modifier = Modifier.padding(start = Theme.spacing.small, end = Theme.spacing.small, bottom = Theme.spacing.small)) {
        Mono(
          stack,
          fontSize = Theme.typography.size10
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

  Column(modifier = Modifier.safeDrawingPadding()) {
    Spacer(Theme.spacing.medium)

    Row(modifier = Modifier.padding(horizontal = Theme.spacing.small)) {
      ActionButton(
        "Tap to Copy Report",
        style = Theme.colors.button.primary,
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
    }

    Spacer(Theme.spacing.small)

    Column(modifier = Modifier.padding(Theme.spacing.small)) {
      Heading(
        "Occurred:"
      )
      Spacer(Theme.spacing.tiny)
      Text(
        SimpleDateFormat.getDateTimeInstance().format(Date(timestamp)).toString()
      )
    }

    Column(modifier = Modifier.padding(Theme.spacing.small)) {
      Heading(
        "Reason:"
      )
      Spacer(Theme.spacing.tiny)
      Text(
        message
      )
    }

    Row(modifier = Modifier.padding(Theme.spacing.small)) {
      Heading(
        "Stack trace:"
      )
      Spacer(Theme.spacing.tiny)
    }

    StackTrace(stack)

    Spacer(Theme.spacing.medium)
  }
}

@Composable
@Preview(showBackground = true)
fun CrashReportScreenPreview() {
  CrashReportScreen(
    timestamp = 1633036800000L,
    message = "Sample crash message",
    stack = "java.lang.RuntimeException: Sample exception\n\tat com.example.app.MainActivity.onCreate(MainActivity.java:23)\n\tat android.app.Activity.performCreate(Activity.java:8000)\n\tat android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3500)\n\tat android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:3600)\n\tat android.app.servertransaction.LaunchActivityItem.execute(LaunchActivityItem.java:85)\n\tat android.app.servertransaction.TransactionExecutor.executeCallbacks(TransactionExecutor.java:135)\n\tat android.app.servertransaction.TransactionExecutor.execute(TransactionExecutor.java:95)\n\tat android.app.ActivityThread.handleMessage(ActivityThread.java:2200)\n\tat android.os.Handler.dispatchMessage(Handler.java:106)\n\tat android.os.Looper.loop(Looper.java:223)\n\tat android.app.ActivityThread.main(ActivityThread.java:7656)\n\tat java.lang.reflect.Method.invoke(Native Method)\n\tat com.android.internal.os.RuntimeInit.run(RuntimeInit.java:592)\n\tat com.android.internal.os.ZygoteInit.main(ZygoteInit.java:947)"
  )
}
