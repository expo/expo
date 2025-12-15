package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devlauncher.compose.ui.StackTrace
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.utils.copyToClipboard
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date

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

      KeyValueRow(
        "Occurred:",
        SimpleDateFormat.getDateTimeInstance().format(Date(timestamp)).toString()
      )

      KeyValueRow(
        "Reason:",
        message
      )
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
private fun KeyValueRow(text: String, value: String) {
  Column(verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)) {
    NewText(
      text,
      style = NewAppTheme.font.lg.merge(
        fontWeight = FontWeight.Medium
      )
    )

    NewText(
      value,
      style = NewAppTheme.font.md,
      color = NewAppTheme.colors.text.secondary
    )
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
