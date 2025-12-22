package host.exp.exponent.home

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.painter.Painter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import expo.modules.devmenu.compose.primitives.Spacer

@Composable
fun ClickableItemRow(
    text: String? = null,
    imageUrl: String? = null,
    icon: Painter? = null,
    onClick: () -> Unit,
    action: (@Composable () -> Unit)? = null,
    content: (@Composable () -> Unit)? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val hasIcon = imageUrl != null || icon != null

        if (imageUrl != null) {
            AsyncImage(
                model = imageUrl,
                contentDescription = "$text icon",
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        }
        else if (icon != null) {
            Icon(
                painter = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
        }

        if (hasIcon) {
            Spacer(modifier = Modifier.width(8.dp))
        }

        if(text != null) {
            Text(
                text = text,
                modifier = Modifier.weight(1f) // Push action to the end
            )
        }

        if(content != null) {
            content()
        }

        // Optional Action (e.g. Radio Button)
        if (action != null) {
            Spacer(modifier = Modifier.width(8.dp))
            action()
        }
    }
}
