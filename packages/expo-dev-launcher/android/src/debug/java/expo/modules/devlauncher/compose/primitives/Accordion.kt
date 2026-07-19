package expo.modules.devlauncher.compose.primitives

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import expo.modules.devlauncher.compose.ui.LauncherIcons
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun Accordion(
  text: String,
  modifier: Modifier = Modifier,
  initialState: Boolean = false,
  accordionContent: @Composable () -> Unit = {}
) {
  var expanded by remember { mutableStateOf(initialState) }

  RoundedSurface(
    color = NewAppTheme.colors.background.subtle,
    borderRadius = NewAppTheme.borderRadius.xl
  ) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .clickable(
          role = Role.Button
        ) { expanded = !expanded }
        .padding(NewAppTheme.spacing.`3`)
    ) {
      Box {
        Row(
          horizontalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`2`),
          verticalAlignment = Alignment.CenterVertically,
          modifier = modifier
        ) {
          LauncherIcons.Plus(
            size = 16.dp,
            tint = NewAppTheme.colors.text.link
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
        Column {
          Spacer(NewAppTheme.spacing.`3`)
          accordionContent()
        }
      }
    }
  }
}

@Composable
@Preview(showBackground = true, heightDp = 200, widthDp = 300)
fun AccordionVariantPreview() {
  Accordion(text = "Enter URL manually") {
    NewText("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nisl interdum, mattis purus a, consequat ipsum. Aliquam sem mauris, egestas a elit a, lacinia efficitur nisi. Maecenas scelerisque erat nisi, ac interdum mauris volutpat vel. Proin sed lectus at purus interdum porta. Ut mollis feugiat dignissim.")
  }
}
