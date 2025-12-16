package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage

@Composable
fun AccountHeaderAction(account: Account?, onLoginClick: () -> Unit = {}, onAccountClick: () -> Unit = {}) {
    if(account == null) {
        OutlinedButton(onClick = onLoginClick) { Text("Log In") }
    } else {
        // Show account info
        AsyncImage(
            model = account.profilePictureUrl, // The URL, URI, or File object
            contentDescription = "Avatar",
            modifier = Modifier.size(24.dp).clip(shape = RoundedCornerShape(4.dp)).clickable(onClick = onAccountClick),
            contentScale = ContentScale.Crop,
        )
    }
}