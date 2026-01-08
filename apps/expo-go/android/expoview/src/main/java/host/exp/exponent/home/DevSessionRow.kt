package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun DevSessionRow(session: DevSession) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .clickable { TODO() }
      .padding(16.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    // Icon for Scan QR Code
    AsyncImage(
      model = "https://picsum.photos/200",
      contentDescription = "Session Icon",
      modifier = Modifier
        .size(24.dp)
        .clip(shape = RoundedCornerShape(4.dp))
    )

    Spacer(modifier = Modifier.width(8.dp))
    Text(
      text = session.hostname ?: "",
    )
  }
}
