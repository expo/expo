@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package host.exp.exponent.experience.splashscreen.legacy

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.RelativeLayout
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade
import host.exp.exponent.experience.splashscreen.ManagedAppSplashScreenConfiguration
import host.exp.expoview.R

// this needs to stay for versioning to work

@SuppressLint("ViewConstructor", "CustomSplashScreen")
class SplashScreenView(
  context: Context
) : RelativeLayout(context) {
  var config: ManagedAppSplashScreenConfiguration? by mutableStateOf(null)

  init {
    layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )

    addView(
      ComposeView(context).apply {
        setViewCompositionStrategy(
          ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed
        )
        setContent {
          SplashScreenView(
            backgroundColor = config?.backgroundColor?.let { Color(it) } ?: Color.White,
            imageUrl = config?.imageUrl ?: "",
            imageWidth = config?.imageWidth ?: 100
          )
        }
      }
    )
  }
}

@Composable
fun SplashScreenView(
  modifier: Modifier = Modifier,
  backgroundColor: Color,
  imageUrl: String,
  imageWidth: Int
) {
  Box(
    modifier = modifier
      .fillMaxSize()
      .background(color = backgroundColor),
    contentAlignment = Alignment.Center
  ) {
    SplashScreenImage(imageUrl, imageWidth)
  }
}

@Composable
fun SplashScreenImage(
  imageUrl: String? = null,
  imageWidth: Int
) {
  AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
      .data(imageUrl)
      .crossfade(true)
      .build(),
    contentDescription = "Splash Screen Image",
    modifier = Modifier.width(imageWidth.dp)
  )
}
