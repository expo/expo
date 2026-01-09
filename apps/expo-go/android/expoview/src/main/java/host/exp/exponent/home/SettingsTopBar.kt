package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import host.exp.expoview.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsTopBar(accountHeader: @Composable () -> Unit) {
  TopAppBar(
    title = {
      Row(verticalAlignment = Alignment.CenterVertically) {
        Image(
          painter = painterResource(id = R.drawable.big_logo_new_filled),
          contentDescription = "Expo Go logo",
          modifier = Modifier.size(32.dp, 32.dp)
        )
        Text("Expo Go", fontWeight = FontWeight.Bold)
      }
    },
    actions = { accountHeader() }
  )
}