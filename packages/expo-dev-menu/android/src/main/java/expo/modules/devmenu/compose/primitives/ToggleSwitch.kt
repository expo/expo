package expo.modules.devmenu.compose.primitives

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.composeunstyled.ToggleSwitch
import expo.modules.devmenu.compose.newtheme.NewAppTheme

@Composable
fun ToggleSwitch(
  isToggled: Boolean,
  onToggled: ((Boolean) -> Unit)? = null
) {
  val animatedBackgroundColor by animateColorAsState(
    if (isToggled) {
      Color(0xFF34C759)
    } else {
      if (NewAppTheme.isDarkTheme) {
        Color(0xFF464646)
      } else {
        Color(0xFFE9E9EB)
      }
    }
  )

  ToggleSwitch(
    toggled = isToggled,
    onToggled = onToggled,
    shape = RoundedCornerShape(NewAppTheme.borderRadius.full),
    backgroundColor = animatedBackgroundColor,
    modifier = Modifier.width(52.dp),
    thumb = {
      Box(modifier = Modifier.padding(2.dp)) {
        Box(
          Modifier
            .clip(CircleShape)
            .background(Color.White)
            .size(28.dp)
        )
      }
    }
  )
}
