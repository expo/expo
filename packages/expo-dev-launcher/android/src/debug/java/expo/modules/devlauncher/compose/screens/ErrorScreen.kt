package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import expo.modules.devlauncher.compose.models.ErrorAction
import expo.modules.devlauncher.compose.ui.ActionButton
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun ErrorScreen(
  stack: String,
  onAction: (ErrorAction) -> Unit = {}
) {
  Column(
    modifier = Modifier
      .background(Theme.colors.background.secondary)
      .fillMaxSize()
      .statusBarsPadding()
  ) {
    Column(modifier = Modifier.padding(horizontal = Theme.spacing.small)) {
      Spacer(Theme.spacing.medium)
      Heading("There was a problem loading the project.")

      Spacer(Theme.spacing.medium)
      Text("This development build encountered the following error.")

      Spacer(Theme.spacing.medium)
    }

    StackTrace(
      stack,
      modifier = Modifier
        .weight(1f)
    )

    Column(
      modifier = Modifier
        .background(Theme.colors.background.default)
        .padding(Theme.spacing.medium)
        .navigationBarsPadding()
    ) {
      ActionButton(
        "Reload",
        style = Theme.colors.button.tertiary,
        onClick = {
          onAction(ErrorAction.Reload)
        }
      )

      Spacer(Theme.spacing.small)

      ActionButton(
        "Go To Home",
        style = Theme.colors.button.secondary,
        onClick = {
          onAction(ErrorAction.GoToHome)
        }
      )
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
