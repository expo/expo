package host.exp.exponent.home

import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import host.exp.exponent.services.HistoryItem

@Composable
fun RecentRow(historyItem: HistoryItem) {
  val uriHandler = LocalUriHandler.current

  val iconUrl = historyItem.manifest?.getIconUrl()

  val name = historyItem.manifest?.getName() ?: historyItem.manifestUrl

  ClickableItemRow(
    text = name,
    icon = {
      AsyncImage(
        model = iconUrl,
        contentDescription = "Icon for $name",
        modifier = Modifier
          .size(24.dp)
          .clip(shape = RoundedCornerShape(4.dp)),
        contentScale = ContentScale.Crop
      )
    },
    onClick = {
      uriHandler.openUri(historyItem.manifestUrl)
    }
  )
}
