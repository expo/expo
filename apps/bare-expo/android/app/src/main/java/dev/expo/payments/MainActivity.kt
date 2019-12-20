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
import expo.modules.taskManager.apploader.HeadlessAppLoader

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MainScreen(initializeReactNative(), openReactNativeActivity())
        }
    }

    private fun initializeReactNative(): () -> Unit {
        return { HeadlessAppLoader(this).loadApp() }
    }

    private fun openReactNativeActivity(): () -> Unit {
        return { ReactActivity.start(this) }
    }

}

@Composable
fun MainScreen(background: () -> Unit, visual: () -> Unit) {
    MaterialTheme {
        Container {
            Column(modifier = Spacing(all = 16.dp)) {
                Button(text = "Run background", onClick = background)
                HeightSpacer(height = 16.dp)
                Button(text = "Open visual", onClick = visual)
            }
        }
    }
}

@Preview
@Composable
fun previewMainScreen() {
    MainScreen({}, {})
}