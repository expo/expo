package host.exp.exponent.home

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.res.painterResource
import host.exp.expoview.R

@Composable
fun DevSessionRow(session: DevSession) {
    val uriHandler = LocalUriHandler.current
    val image = if (session.source == DevSessionSource.Desktop) {
        painterResource(id = R.drawable.cli)
    } else {
        painterResource(id = R.drawable.snack)
    }
    ClickableItemRow(onClick = { uriHandler.openUri(session.url) }, image = image) {
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
