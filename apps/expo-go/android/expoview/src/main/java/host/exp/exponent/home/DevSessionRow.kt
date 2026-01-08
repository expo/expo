package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import host.exp.expoview.R

@Composable
fun DevSessionRow(session: DevSession) {
  val uriHandler = LocalUriHandler.current
  val image = if (session.source == DevSessionSource.Desktop) {
    painterResource(id = R.drawable.cli)
  } else {
    painterResource(id = R.drawable.snack)
  }
  ClickableItemRow(
    onClick = { uriHandler.openUri(session.url) },
    icon = {
      Image(
        painter = image,
        contentDescription = session.source.name,
        modifier = Modifier.size(24.dp)
      )
    }) {
    Column {
      // TODO: Add platform icon
      Text(
        text = session.description,
      )
      Text(
        text = session.url,
        style = MaterialTheme.typography.bodySmall
      )
    }
  }
}
