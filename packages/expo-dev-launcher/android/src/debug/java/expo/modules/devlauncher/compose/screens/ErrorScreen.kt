package expo.modules.devlauncher.compose.screens

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.compose.models.ErrorAction
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devlauncher.compose.ui.StackTrace
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import kotlinx.coroutines.delay

@Composable
fun ErrorScreen(
  stack: String,
  onAction: (ErrorAction) -> Unit = {}
) {
  val context = LocalContext.current
  var copied by remember { mutableStateOf(false) }

  LaunchedEffect(copied) {
    if (copied) {
      delay(2000)
      copied = false
    }
  }

  Column(
    modifier = Modifier
      .background(NewAppTheme.colors.background.subtle)
      .fillMaxSize()
      .statusBarsPadding()
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`3`),
      modifier = Modifier
        .padding(
          horizontal = NewAppTheme.spacing.`2`,
          vertical = NewAppTheme.spacing.`3`
        )
    ) {
      NewText(
        "There was a problem loading the project.",
        style = NewAppTheme.font.lg.merge(
          fontWeight = FontWeight.SemiBold
        )
      )

      NewText("This development build encountered the following error:")
    }

    StackTrace(
      stack,
      modifier = Modifier
        .weight(1f)
    )

    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
      modifier = Modifier
        .background(NewAppTheme.colors.background.default)
        .padding(NewAppTheme.spacing.`3`)
        .navigationBarsPadding()
    ) {
      ActionButton(
        "Reload",
        foreground = NewAppTheme.colors.buttons.tertiary.foreground,
        background = NewAppTheme.colors.buttons.tertiary.background,
        modifier = Modifier.padding(vertical = NewAppTheme.spacing.`2`),
        onClick = {
          onAction(ErrorAction.Reload)
        }
      )

      Row(
        horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`)
      ) {
        Box(modifier = Modifier.weight(1f)) {
          ActionButton(
            "Go home",
            foreground = NewAppTheme.colors.buttons.secondary.foreground,
            background = NewAppTheme.colors.buttons.secondary.background,
            modifier = Modifier.padding(vertical = NewAppTheme.spacing.`2`),
            onClick = {
              onAction(ErrorAction.GoToHome)
            }
          )
        }

        Box(modifier = Modifier.weight(1f)) {
          ActionButton(
            if (copied) "Copied!" else "Copy",
            foreground = NewAppTheme.colors.buttons.secondary.foreground,
            background = NewAppTheme.colors.buttons.secondary.background,
            modifier = Modifier.padding(vertical = NewAppTheme.spacing.`2`),
            onClick = {
              val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
              clipboard.setPrimaryClip(ClipData.newPlainText("Error", stack))
              copied = true
            }
          )
        }
      }
    }
  }
}

@Preview
@Composable
fun ErrorScreenPreview() {
  ErrorScreen(
    stack = "java.lang.RuntimeException: Sample exception\n\tat com.example.app.MainActivity.onCreate(MainActivity.java:23)\n\tat android.app.Activity.performCreate(Activity.java:8000)\n\tat android.app.ActivityThread.performLaunchActivity(ActivityThread.java:3500)\n\tat android.app.ActivityThread.handleLaunchActivity(ActivityThread.java:3600)\n\tat android.app.servertransaction.LaunchActivityItem.execute(LaunchActivityItem.java:85)\n\tat android.app.servertransaction.TransactionExecutor.executeCallbacks(TransactionExecutor.java:135)\n\tat android.app.servertransaction.TransactionExecutor.execute(TransactionExecutor.java:95)\n\tat android.app.ActivityThread.handleMessage(ActivityThread.java:2200)\n\tat android.os.Handler.dispatchMessage(Handler.java:106)\n\tat android.os.Looper.loop(Looper.java:223)\n\tat android.app.ActivityThread.main(ActivityThread.java:7656)\n\tat java.lang.reflect.Method.invoke(Native Method)\n\tat com.android.internal.os.RuntimeInit.run(RuntimeInit.java:592)\n\tat com.android.internal.os.ZygoteInit.main(ZygoteInit.java:947)"
  )
}
