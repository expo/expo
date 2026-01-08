package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import host.exp.exponent.graphql.fragment.CurrentUserActorData

@Composable
fun AccountHeaderAction(
    account: CurrentUserActorData.Account?,
    onLoginClick: () -> Unit = {},
    onAccountClick: () -> Unit = {}
) {
    if (account == null) {
        OutlinedButton(onClick = onLoginClick) { Text("Log In") }
        return
    }

    if (account.ownerUserActor == null) {
        Icon(
            painter = painterResource(expo.modules.devmenu.R.drawable.alert),
            contentDescription = "Account icon",
            modifier = Modifier
                .size(24.dp)
                .clip(shape = CircleShape)
                .clickable(onClick = onAccountClick),
        )
        return
    }

    // Show account info
    AsyncImage(
        model = account.ownerUserActor.profilePhoto,
        contentDescription = "Avatar",
        modifier = Modifier
            .size(24.dp)
            .clip(shape = RoundedCornerShape(4.dp))
            .clickable(onClick = onAccountClick),
        contentScale = ContentScale.Crop,
    )
}
