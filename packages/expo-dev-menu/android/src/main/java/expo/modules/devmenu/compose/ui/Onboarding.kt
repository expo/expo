package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.tooling.preview.Preview
import com.composeunstyled.Button
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.ripple.ripple

@Composable
fun SimulatorMessage() {
  val annotatedString = buildAnnotatedString {
    append("You can press ")
    withStyle(style = SpanStyle(fontWeight = FontWeight.Bold)) {
      append("\u2318 + m")
    }
    append(" on macOS or ")
    withStyle(style = SpanStyle(fontWeight = FontWeight.Bold)) {
      append("Ctrl + m")
    }
    append(" on other platforms to get back to it at any time.")
  }

  NewText(annotatedString)
}

@Composable
fun DeviceMessage() {
  NewText("You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.")
}

@Composable
fun Onboarding(onOnboardingFinished: () -> Unit = {}) {
  val isEmulator = remember { EmulatorUtilities.isRunningOnEmulator() }

  Column(
    modifier = Modifier
      .background(NewAppTheme.colors.background.default)
      .padding(horizontal = NewAppTheme.spacing.`3`, vertical = NewAppTheme.spacing.`2`)
  ) {
    NewText(
      "This is the developer menu. It gives you access to useful tools in your development builds."
    )

    Spacer(NewAppTheme.spacing.`2`)

    if (!isEmulator) {
      DeviceMessage()
    } else {
      SimulatorMessage()
    }

    Spacer(NewAppTheme.spacing.`3`)

    Button(
      onClick = onOnboardingFinished,
      shape = RoundedCornerShape(NewAppTheme.borderRadius.md),
      backgroundColor = NewAppTheme.colors.buttons.primary.background,
      indication = ripple(color = NewAppTheme.colors.buttons.primary.foreground)
    ) {
      Box(
        contentAlignment = Alignment.Center,
        modifier = Modifier
          .padding(vertical = NewAppTheme.spacing.`2`)
          .fillMaxWidth()
      ) {
        NewText(
          "Continue",
          color = NewAppTheme.colors.buttons.primary.foreground,
          style = NewAppTheme.font.md.merge(
            fontWeight = FontWeight.SemiBold
          )
        )
      }
    }

    Spacer(NewAppTheme.spacing.`2`)
  }
}

@Preview(showBackground = true)
@Composable
fun OnboardingPreview() {
  Onboarding()
}
