package expo.modules.devmenu.compose.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Button
import com.composeunstyled.Thumb
import com.composeunstyled.ToggleSwitch
import expo.modules.devmenu.compose.primitives.DayNighIcon
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun MenuSwitch(
  label: String,
  icon: Painter? = null,
  toggled: Boolean = false,
  onToggled: (Boolean) -> Unit = {}
) {
  val animatedBackgroundColor by animateColorAsState(
    if (toggled) {
      Theme.colors.background.success
    } else {
      Theme.colors.background.secondary
    }
  )

  val animatedThumbColor by animateColorAsState(
    if (toggled) {
      Theme.colors.text.success
    } else {
      Color.White
    }
  )

  Button(
    onClick = {
      onToggled(!toggled)
    },
    backgroundColor = Theme.colors.background.default
  ) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      modifier = Modifier
        .padding(Theme.spacing.small)
    ) {
      if (icon != null) {
        DayNighIcon(
          icon,
          contentDescription = label,
          modifier = Modifier.size(Theme.sizing.icon.small)
        )

        Spacer(Modifier.size(Theme.spacing.small))
      }

      Text(label)

      Spacer(Modifier.weight(1f))

      ToggleSwitch(
        toggled = toggled,
        onToggled = null,
        shape = RoundedCornerShape(Theme.sizing.borderRadius.full),
        backgroundColor = animatedBackgroundColor,
        modifier = Modifier
          .shadow(elevation = 4.dp, shape = RoundedCornerShape(Theme.sizing.borderRadius.full)),
        thumb = {
          Thumb(
            shape = CircleShape,
            color = animatedThumbColor,
            modifier = Modifier.shadow(elevation = 4.dp, CircleShape)
          )
        }
      )
    }
  }
}

@Composable
@Preview(showBackground = true)
fun MenuSwitchPreview() {
  var toggled by remember { mutableStateOf(false) }
  MenuSwitch(
    label = "Menu Switch",
    toggled = toggled,
    onToggled = { toggled = it }
  )
}
