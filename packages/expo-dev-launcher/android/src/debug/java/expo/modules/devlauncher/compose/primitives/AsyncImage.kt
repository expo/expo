package expo.modules.devlauncher.compose.primitives

import androidx.compose.foundation.Image
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap
import expo.modules.devlauncher.services.ImageLoaderService
import expo.modules.devlauncher.services.inject
import kotlinx.coroutines.launch

@Composable
private fun rememberImageBitmap(url: String): ImageBitmap? {
  val imageLoaderService = inject<ImageLoaderService>()
  val scope = rememberCoroutineScope()
  var imageBitmap by remember { mutableStateOf(imageLoaderService.loadFromMemory(url)?.asImageBitmap()) }

  LaunchedEffect(url) {
    scope.launch {
      val image = imageLoaderService.loadImage(url)
      if (image != null) {
        imageBitmap = image.asImageBitmap()
      }
    }
  }

  return imageBitmap
}

@Composable
fun AsyncImage(
  url: String
) {
  val imageBitmap = rememberImageBitmap(url)
  if (imageBitmap == null) {
    return
  }

  Image(
    bitmap = imageBitmap,
    contentDescription = url
  )
}
