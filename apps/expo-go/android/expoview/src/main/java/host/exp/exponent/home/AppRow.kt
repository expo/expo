package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import host.exp.exponent.graphql.Home_AccountAppsQuery

@Composable
fun AppRow(app: Home_AccountAppsQuery.App) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = {  })
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column() {
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
