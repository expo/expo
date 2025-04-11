@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package host.exp.exponent.experience.splashscreen.legacy

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.RelativeLayout
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.rememberAsyncImagePainter
import coil3.request.ImageRequest

// this needs to stay for versioning to work

@SuppressLint("ViewConstructor", "CustomSplashScreen")
class SplashScreenView(
  context: Context
) : RelativeLayout(context) {
  var imageUrl = ""
  var appName = ""
  var progress = 0
  val backgroundColor = Color.White

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
            imageUrl = imageUrl,
            appName = appName,
            progress = 100 - progress
          )
        }
      }
    )
  }
}

@Composable
fun SplashScreenView(
  modifier: Modifier = Modifier,
  imageUrl: String,
  appName: String,
  progress: Int = 0
) {
  Box(
    modifier = modifier
      .fillMaxSize()
      .background(color = Color.White),
    contentAlignment = Alignment.Center
  ) {
    Column(
      verticalArrangement = Arrangement.spacedBy(30.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      SplashScreenImage(
        resizeMode = SplashScreenImageResizeMode.CONTAIN,
        imageUrl
      )
      Text(appName, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
    }
  }
}

@Composable
fun SplashScreenImage(
  resizeMode: SplashScreenImageResizeMode,
  imageUrl: String? = null
) {
  val width = 200.dp
  val height = 200.dp
  var visible by remember { mutableStateOf(false) }

  val painter = rememberAsyncImagePainter(
    model = ImageRequest.Builder(LocalContext.current)
      .data(imageUrl)
      .build(),
    onSuccess = {
      visible = true
    },
    contentScale = resizeMode.toContentScale()
  )

  AnimatedVisibility(visible = visible, enter = fadeIn(animationSpec = tween(300))) {
    Image(
      painter = painter,
      contentDescription = "Splash Screen Image",
      modifier = Modifier
        .width(width)
        .height(height)
        .shadow(4.dp, RoundedCornerShape(30.dp))
    )
  }
}
