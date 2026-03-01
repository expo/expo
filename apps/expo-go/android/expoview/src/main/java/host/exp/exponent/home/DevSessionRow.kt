package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import host.exp.expoview.R

@Composable
fun DevSessionRow(session: DevSession) {
  val uriHandler = LocalUriHandler.current

  ClickableItemRow(
    onClick = { uriHandler.openUri(session.url) },
    icon = {
      if (session.iconUrl != null) {
        AsyncImage(
          session.iconUrl,
          contentDescription = "Icon",
          modifier = Modifier
            .size(24.dp)
            .clip(shape = RoundedCornerShape(4.dp))
        )
      } else {
        Image(
          painter = painterResource(
            id = if (session.source == DevSessionSource.Desktop) {
              R.drawable.cli
            } else {
              R.drawable.snack
            }
          ),
          contentDescription = "Icon",
          modifier = Modifier
            .size(24.dp)
            .clip(shape = RoundedCornerShape(4.dp))
        )
      }
    }
  ) {
    Column {
      // TODO: Add platform icon
      Text(
        text = session.description
      )
      Text(
        text = session.url,
        style = MaterialTheme.typography.bodySmall
      )
    }
  }
}
