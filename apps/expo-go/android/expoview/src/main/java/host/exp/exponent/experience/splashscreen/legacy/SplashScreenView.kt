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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.ComposeView
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.ViewCompositionStrategy
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import coil3.request.ImageRequest
import coil3.request.crossfade
import host.exp.expoview.R

// this needs to stay for versioning to work

@SuppressLint("ViewConstructor", "CustomSplashScreen")
class SplashScreenView(
  context: Context
) : RelativeLayout(context) {
  var imageUrl = ""
  var appName = ""
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
      SplashScreenImage(imageUrl)
      Text(appName, fontSize = 20.sp, fontWeight = FontWeight.SemiBold)
    }
  }
}

@Composable
fun SplashScreenImage(
  imageUrl: String? = null
) {
  AsyncImage(
    model = ImageRequest.Builder(LocalContext.current)
      .data(imageUrl)
      .crossfade(true)
      .build(),
    contentDescription = "Splash Screen Image",
    contentScale = ContentScale.Fit,
    placeholder = painterResource(R.drawable.project_default_icon),
    modifier = Modifier
      .size(200.dp)
      .background(Color.White)
      .shadow(4.dp, RoundedCornerShape(30.dp))
  )
}
