import android.annotation.SuppressLint
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Icon
import expo.modules.devmenu.R
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import kotlinx.coroutines.launch

@SuppressLint("UnusedBoxWithConstraintsScope")
@Composable
fun FloatingActionButtonContent(
  modifier: Modifier = Modifier,
  interactionSource: MutableInteractionSource = remember { MutableInteractionSource() },
  onRefreshPress: () -> Unit = {},
  onEllipsisPress: () -> Unit = {}
) {
  val pillShape = RoundedCornerShape(percent = 50)
  val horizontalPadding = 14.dp
  val verticalPadding = 16.dp
  val animatedRotation = remember { Animatable(0f) }
  val animatedScale = remember { Animatable(1f) }
  val scope = rememberCoroutineScope()

  BoxWithConstraints(
    modifier = modifier
      .shadow(6.dp, pillShape)
      .border(
        width = 1.dp,
        color = NewAppTheme.colors.border.default,
        shape = pillShape
      )
      .background(
        color = NewAppTheme.colors.background.default,
        shape = pillShape
      )
      .clip(pillShape)
  ) {
    val iconSize = maxWidth - (horizontalPadding * 2)

    Column(
      verticalArrangement = Arrangement.SpaceBetween,
      horizontalAlignment = Alignment.CenterHorizontally,
      modifier = modifier
        .border(
          width = 1.dp,
          color = NewAppTheme.colors.border.default,
          shape = pillShape
        )
        .fillMaxSize()
        .padding(horizontal = horizontalPadding, vertical = verticalPadding)
    ) {
      Icon(
        painter = painterResource(R.drawable.refresh_round_icon),
        contentDescription = "Refresh",
        tint = NewAppTheme.colors.icon.tertiary,
        modifier = Modifier
          .size(iconSize)
          .rotate(animatedRotation.value)
          .clickable(
            interactionSource = interactionSource,
            indication = null,
            onClick = {
              onRefreshPress()
              scope.launch {
                animatedRotation.animateTo(
                  targetValue = 360f,
                  animationSpec = spring(
                    dampingRatio = Spring.DampingRatioLowBouncy,
                    stiffness = Spring.StiffnessVeryLow,
                    visibilityThreshold = 2f
                  )
                )
                animatedRotation.snapTo(0f)
              }
            }
          )
      )

      Icon(
        painter = painterResource(R.drawable.ellipsis_horizontal),
        contentDescription = "Open Dev Menu",
        tint = NewAppTheme.colors.icon.tertiary,
        modifier = Modifier
          .size(iconSize)
          .scale(animatedScale.value)
          .clickable(
            interactionSource = interactionSource,
            // TODO @behenate: Figure out how to use ripple instead of scale animation with an interaction source shared by both buttons
            indication = null,
            onClick = {
              onEllipsisPress()
              scope.launch {
                animatedScale.snapTo(0.9f)
                animatedScale.animateTo(
                  targetValue = 1f,
                  animationSpec = spring(
                    dampingRatio = Spring.DampingRatioMediumBouncy,
                    stiffness = Spring.StiffnessLow
                  )
                )
              }
            }
          )
      )
    }
  }
}

@Preview(showBackground = true)
@Composable
fun VerticalActionPillPreview() {
  // You would typically wrap this in your app's theme.
  // Using a basic Column for positioning in the preview.
  Column(
    modifier = Modifier
      .padding(32.dp)
      .background(NewAppTheme.colors.border.default),
    horizontalAlignment = Alignment.CenterHorizontally
  ) {
    FloatingActionButtonContent(modifier = Modifier.size(46.dp, 92.dp))
  }
}
