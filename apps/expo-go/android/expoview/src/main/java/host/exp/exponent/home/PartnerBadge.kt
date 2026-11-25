package host.exp.exponent.home

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import host.exp.expoview.R

@Composable
fun PartnerBadge(modifier: Modifier = Modifier) {
  val shape = RoundedCornerShape(3.dp)
  Box(
    contentAlignment = Alignment.Center,
    modifier = modifier
      .size(12.dp)
      .background(MaterialTheme.colorScheme.primary, shape)
      .border(1.dp, MaterialTheme.colorScheme.surface, shape)
  ) {
    Icon(
      painter = painterResource(R.drawable.link),
      contentDescription = "Partner account",
      tint = MaterialTheme.colorScheme.onPrimary,
      modifier = Modifier.size(8.dp)
    )
  }
}
