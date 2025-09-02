package expo.modules.devlauncher.compose.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun BottomTabButton(
  label: String,
  icon: @Composable (size: Dp, tint: Color) -> Unit,
  isSelected: Boolean,
  modifier: Modifier = Modifier,
  onClick: () -> Unit
) {
  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`1`),
    modifier = modifier
      .clip(
        RoundedCornerShape(NewAppTheme.borderRadius.md)
      )
      .clickable(enabled = !isSelected) {
        onClick()
      }
      .background(
        if (isSelected) {
          NewAppTheme.colors.background.info
        } else {
          Color.Unspecified
        }
      )
      .padding(vertical = NewAppTheme.spacing.`2`)
  ) {
    icon(
      24.dp,
      if (isSelected) {
        NewAppTheme.colors.icon.info
      } else {
        NewAppTheme.colors.icon.quaternary
      }
    )

    NewText(
      label,
      style = NewAppTheme.font.sm.merge(
        fontWeight = FontWeight.Medium
      ),
      color = if (isSelected) {
        NewAppTheme.colors.icon.info
      } else {
        NewAppTheme.colors.icon.quaternary
      }
    )
  }
}
