package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.Home_AccountSnacksQuery

@Composable
fun SnackRow(snack: Home_AccountSnacksQuery.Snack) {
  val uriHandler = LocalUriHandler.current
//    TODO: Add missing SDK versions
  Row(
    modifier = Modifier
        .fillMaxWidth()
        .clickable(onClick = { uriHandler.openUri(normalizeSnackUrl(snack.commonSnackData.fullName)) })
        .padding(16.dp),
    verticalAlignment = Alignment.CenterVertically
  ) {
    Text(
      text = snack.commonSnackData.name,
      fontWeight = FontWeight.Medium
    )
  }
}
