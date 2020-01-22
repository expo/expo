package dev.expo.payments

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.Composable
import androidx.ui.core.dp
import androidx.ui.core.setContent
import androidx.ui.layout.Column
import androidx.ui.layout.Container
import androidx.ui.layout.HeightSpacer
import androidx.ui.layout.Spacing
import androidx.ui.material.Button
import androidx.ui.material.MaterialTheme
import androidx.ui.tooling.preview.Preview
import com.facebook.react.ReactApplication

class MainActivity : AppCompatActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MainScreen(runBackgroundInstanceManager(), destroyReactInstance(), openReactNativeActivity())
    }
  }

  private fun destroyReactInstance(): () -> Unit = {
    (applicationContext as ReactApplication).reactNativeHost.reactInstanceManager.destroy()
  }

  private fun runBackgroundInstanceManager(): () -> Unit = {
    (applicationContext as ReactApplication).reactNativeHost.reactInstanceManager.createReactContextInBackground()
  }

  private fun openReactNativeActivity(): () -> Unit = { ReactActivity.start(this) }

}

@Composable
fun MainScreen(background: () -> Unit, destroy: () -> Unit, visual: () -> Unit) {
  MaterialTheme {
    Container {
      Column(modifier = Spacing(all = 16.dp)) {
        Button(text = "Run background", onClick = background)
        HeightSpacer(height = 16.dp)
        Button(text = "Destroy InstanceManager", onClick = destroy)
        HeightSpacer(height = 16.dp)
        Button(text = "Open visual", onClick = visual)
      }
    }
  }
}

@Preview
@Composable
fun previewMainScreen() {
  MainScreen({}, {}, {})
}