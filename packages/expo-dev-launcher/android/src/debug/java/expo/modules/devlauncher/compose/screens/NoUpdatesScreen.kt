package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.withLink
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.ui.DefaultScreenContainer
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import expo.modules.devmenu.compose.primitives.NewText

@Composable
fun NoUpdatesScreen(onProfileClick: () -> Unit = {}) {
  Column(
    modifier = Modifier.padding(horizontal = NewAppTheme.spacing.`4`)
  ) {
    Box(modifier = Modifier.padding(vertical = NewAppTheme.spacing.`4`)) {
      AppHeader(onProfileClick = onProfileClick)
    }

    Box(
      contentAlignment = Alignment.Center,
      modifier = Modifier.fillMaxSize()
    ) {
      Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(NewAppTheme.spacing.`4`),
        modifier = Modifier.fillMaxWidth()
      ) {
        Image(
          painter = painterResource(R.drawable.extensions_icon),
          contentDescription = "Updates Screen",
          modifier = Modifier.size(48.dp)
        )

        val annotatedString = buildAnnotatedString {
          append("Extensions allow you to customize your development build\nwith additional capabilities. ")
          withLink(
            LinkAnnotation.Url(
              "https://docs.expo.dev/develop/development-builds/development-workflows/",
              TextLinkStyles(
                style = SpanStyle(
                  textDecoration = TextDecoration.Underline,
                  color = NewAppTheme.colors.text.link
                )
              )
            )
          ) {
            append("Learn more.")
          }
        }

        NewText(
          annotatedString,
          style = NewAppTheme.font.sm.merge(
            color = NewAppTheme.colors.text.secondary,
            textAlign = TextAlign.Center
          ),
          color = NewAppTheme.colors.text.secondary
        )
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun NoUpdatesScreenPreview() {
  DefaultScreenContainer {
    NoUpdatesScreen()
  }
}
