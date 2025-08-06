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
import expo.modules.devmenu.compose.primitives.Heading
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.ripple.ripple
import expo.modules.devmenu.compose.theme.Theme

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

  Text(annotatedString)
}

@Composable
fun DeviceMessage() {
  Text("You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.")
}

@Composable
fun Onboarding(onOnboardingFinished: () -> Unit = {}) {
  val isEmulator = remember { EmulatorUtilities.isRunningOnEmulator() }

  Column(
    modifier = Modifier
      .background(Theme.colors.background.default)
      .padding(horizontal = Theme.spacing.large, vertical = Theme.spacing.medium)
  ) {
    Text(
      "This is the developer menu. It gives you access to useful tools in your development builds."
    )

    Spacer(Theme.spacing.medium)

    if (!isEmulator) {
      DeviceMessage()
    } else {
      SimulatorMessage()
    }

    Spacer(Theme.spacing.large)

    Button(
      onClick = onOnboardingFinished,
      shape = RoundedCornerShape(Theme.sizing.borderRadius.medium),
      backgroundColor = Theme.colors.button.primary.background,
      indication = ripple(color = Theme.colors.button.primary.foreground)
    ) {
      Box(
        contentAlignment = Alignment.Companion.Center,
        modifier = Modifier.Companion
          .padding(vertical = Theme.spacing.small)
          .fillMaxWidth()
      ) {
        Heading("Continue", color = Theme.colors.button.primary.foreground, fontSize = Theme.typography.medium)
      }
    }

    Spacer(Theme.spacing.medium)
  }
}

@Preview(showBackground = true)
@Composable
fun OnboardingPreview() {
  Onboarding()
}
