package expo.modules.devlauncher.compose.primitives

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.composeunstyled.Icon
import expo.modules.devlauncher.R
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.Text

@Composable
fun Accordion(
  text: String,
  modifier: Modifier = Modifier,
  initialState: Boolean = false,
  accordionContent: @Composable () -> Unit = {}
) {
  var expanded by remember { mutableStateOf(initialState) }
  val arrowRotation by animateFloatAsState(
    targetValue = if (expanded) 90f else 0f,
    label = "accordion-arrow"
  )

  Column {
    Box(
      modifier = Modifier
        .clickable { expanded = !expanded }
    ) {
      Row(
        horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
        verticalAlignment = Alignment.CenterVertically,
        modifier = modifier
      ) {
        Icon(
          painter = painterResource(R.drawable.arrow_right),
          contentDescription = "Accordion Arrow",
          tint = NewAppTheme.colors.text.link,
          modifier = Modifier
            .rotate(arrowRotation)
            .size(16.dp)
        )

        NewText(
          text = text,
          style = NewAppTheme.font.sm,
          color = NewAppTheme.colors.text.link
        )
      }
    }

    AnimatedVisibility(
      visible = expanded,
      enter = expandVertically(
        expandFrom = Alignment.Top,
        animationSpec = tween()
      ),
      exit = shrinkVertically(
        shrinkTowards = Alignment.Top,
        animationSpec = tween()
      )
    ) {
      accordionContent()
    }
  }
}

@Composable
@Preview(showBackground = true, heightDp = 200)
fun AccordionVariantPreview() {
  Accordion(text = "Enter URL manually") {
    Text("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nisl interdum, mattis purus a, consequat ipsum. Aliquam sem mauris, egestas a elit a, lacinia efficitur nisi. Maecenas scelerisque erat nisi, ac interdum mauris volutpat vel. Proin sed lectus at purus interdum porta. Ut mollis feugiat dignissim.")
  }
}
