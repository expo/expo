package expo.modules.devlauncher.compose.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
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
import expo.modules.devlauncher.R
import expo.modules.devlauncher.compose.ui.AppHeader
import expo.modules.devlauncher.compose.ui.ScreenHeaderContainer
import expo.modules.devmenu.compose.primitives.RoundedSurface
import expo.modules.devmenu.compose.primitives.Spacer
import expo.modules.devmenu.compose.primitives.Text
import expo.modules.devmenu.compose.theme.Theme

@Composable
fun NoUpdatesScreen(onProfileClick: () -> Unit = {}) {
  Column(modifier = Modifier.fillMaxSize()) {
    ScreenHeaderContainer(modifier = Modifier.padding(Theme.spacing.medium)) {
      AppHeader(
        onProfileClick = onProfileClick
      )
    }

    Row(modifier = Modifier.padding(Theme.spacing.medium)) {
      RoundedSurface {
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.padding(Theme.spacing.small)) {
          Image(
            painter = painterResource(R.drawable.extensions_icon),
            contentDescription = "Updates Screen"
          )

          Spacer(Theme.spacing.small)

          val annotatedString = buildAnnotatedString {
            append("Extensions allow you to customize your development build with additional capabilities. ")
            withLink(
              LinkAnnotation.Url(
                "https://docs.expo.dev/develop/development-builds/development-workflows/",
                TextLinkStyles(style = SpanStyle(textDecoration = TextDecoration.Underline))
              )
            ) {
              append("Learn more.")
            }
          }
          Text(
            annotatedString,
            fontSize = Theme.typography.small,
            textAlign = TextAlign.Center
          )
        }
      }
    }
  }
}

@Preview(showBackground = true)
@Composable
fun NoUpdatesScreenPreview() {
  NoUpdatesScreen()
}
