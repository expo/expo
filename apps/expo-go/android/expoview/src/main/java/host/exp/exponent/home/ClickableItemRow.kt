package host.exp.exponent.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import expo.modules.devmenu.compose.primitives.Spacer

typealias ComposableFunction = @Composable () -> Unit

@Composable
fun ClickableItemRow(
    text: String? = null,
    image: Painter? = null,
    imageUrl: String? = null,
    icon: Painter? = null,
    onClick: () -> Unit,
    action: ComposableFunction? = null,
    content: ComposableFunction? = null,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        val hasIcon = imageUrl != null || icon != null || image != null

        // TODO: Reconsider passing icon as Painter vs COmposableFunction
        if (icon != null) {
            Icon(
                painter = icon,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
        } else if (image != null) {
            Image(
                painter = image,
                contentDescription = null,
                modifier = Modifier.size(24.dp)
            )
        } else if (imageUrl != null) {
            AsyncImage(
                model = imageUrl,
                contentDescription = "$text icon",
                modifier = Modifier
                    .size(24.dp)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        }

        if (hasIcon) {
            Spacer(modifier = Modifier.width(8.dp))
        }

        if (text != null) {
            Text(
                text = text,
                modifier = Modifier.weight(1f)
            )
        }

        if (content != null) {
            content()
        }

        if (action != null) {
            Spacer(modifier = Modifier.width(8.dp))
            action()
        }
    }

    if (text != null) {
        Text(
            text = text,
            modifier = Modifier.weight(1f)
        )
    }

    content?.invoke()

    if (action != null) {
        Spacer(modifier = Modifier.width(8.dp))
        action()
    }
}
}
