package expo.modules.devmenu.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface

@Composable
fun Warning(
  text: String
) {
  RoundedSurface(
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
      modifier = Modifier
        .fillMaxWidth()
        .background(NewAppTheme.colors.background.warning)
        .padding(NewAppTheme.spacing.`3`)
    ) {
      Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`)
      ) {
        MenuIcons.Warning(
          size = 18.dp,
          tint = NewAppTheme.colors.icon.warning
        )

        NewText(
          "Warning",
          color = NewAppTheme.colors.text.warning,
          style = NewAppTheme.font.lg.merge(
            fontWeight = FontWeight.Medium
          )
        )
      }

      NewText(
        text,
        style = NewAppTheme.font.sm
      )
    }
  }
}

@Composable
@Preview(showBackground = true, backgroundColor = 0xFFFFFFFF)
fun WarningPreview() {
  Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(16.dp)) {
    Warning(
      text = "This is a warning message. Please take caution."
    )
  }
}
