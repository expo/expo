package host.exp.exponent.home

import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import expo.modules.devmenu.compose.newtheme.NewAppTheme
import host.exp.expoview.R

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopAppBarWithBackIcon(label: String, onGoBack: () -> Unit) {
  TopAppBar(
    navigationIcon = {
      IconButton(onClick = onGoBack) {
        Icon(
          painter = painterResource(id = R.drawable.arrow_back),
          contentDescription = "Go back to home",
        )
      }
    },
    title = {
      Text(label, fontWeight = FontWeight.Bold)
    },
    colors = TopAppBarDefaults.topAppBarColors(containerColor = NewAppTheme.colors.background.default),
  )
}
