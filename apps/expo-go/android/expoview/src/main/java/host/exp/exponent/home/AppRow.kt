package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import host.exp.exponent.graphql.Home_AccountAppsQuery

@Composable
fun AppRow(app: Home_AccountAppsQuery.App, onClick: () -> Unit) {
  Row(
    modifier = Modifier
      .fillMaxWidth()
      .padding(16.dp)
      .clickable { onClick() },
    verticalAlignment = Alignment.CenterVertically
  ) {
    Column {
      Text(
        text = app.commonAppData.name,
      )
      Text(
        text = app.commonAppData.fullName,
      )
    }
    Spacer(modifier = Modifier.width(8.dp))
  }
}
