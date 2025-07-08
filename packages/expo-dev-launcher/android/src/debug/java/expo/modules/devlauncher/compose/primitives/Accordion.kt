package expo.modules.devlauncher.compose.primitives

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.padding
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
import com.composables.core.Icon
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

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

  Box(
    modifier = modifier
  ) {
    Column {
      Box(
        modifier = Modifier
          .clickable { expanded = !expanded }
      ) {
        Row(
          verticalAlignment = Alignment.CenterVertically,
          modifier = Modifier
            .padding(Theme.spacing.medium)
        ) {
          Icon(
            painter = painterResource(expo.modules.devmenu.R.drawable._expodevclientcomponents_assets_chevronrighticon),
            contentDescription = "Accordion Arrow",
            modifier = Modifier
              .rotate(arrowRotation)
          )
          Spacer(Modifier.size(Theme.spacing.small))
          Text(
            text = text,
            modifier = Modifier.weight(1f)
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
        Box(
          modifier = Modifier
            .padding(horizontal = Theme.spacing.small)
        ) {
          accordionContent()
        }
      }
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
