@file:Suppress("UnusedImport") // this needs to stay for versioning to work

package host.exp.exponent.experience.splashscreen.legacy

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import android.widget.RelativeLayout
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImagePainter
import coil3.compose.rememberAsyncImagePainter

// this needs to stay for versioning to work

@SuppressLint("ViewConstructor", "CustomSplashScreen")
class SplashScreenView(
  context: Context
) : RelativeLayout(context) {
  var imageUrl = ""
  var appName = ""

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
            appName = appName
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
  appName: String
) {
  val painter = rememberAsyncImagePainter(imageUrl)
  val state by painter.state.collectAsState()

  val alpha by animateFloatAsState(
    animationSpec = tween(300),
    label = "splash-fade",
    targetValue =
    if (state is AsyncImagePainter.State.Success || state is AsyncImagePainter.State.Error) {
      1f
    } else {
      0f
    }
  )

  Box(
    modifier = modifier.fillMaxSize().background(color = Color.White),
    contentAlignment = Alignment.Center
  ) {
    Column(
      modifier = Modifier.alpha(alpha),
      verticalArrangement = Arrangement.spacedBy(30.dp),
      horizontalAlignment = Alignment.CenterHorizontally
    ) {
      if (state is AsyncImagePainter.State.Success) {
        Image(
          painter = painter,
          contentDescription = "Splash Screen Image",
          contentScale = ContentScale.Fit,
          modifier =
          Modifier.size(200.dp).background(Color.White).shadow(4.dp, RoundedCornerShape(30.dp))
        )
      }
      Text(appName, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
    }
  }
}
