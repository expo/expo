package dev.expo.brownfieldintegratedtester

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.tooling.preview.Preview
import com.community.minimaltester.brownfield.BrownfieldActivity
import com.community.minimaltester.brownfield.showReactNativeFragment
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import dev.expo.brownfieldintegratedtester.ui.theme.BrownfieldIntegratedTesterTheme

class MainActivity : BrownfieldActivity(), DefaultHardwareBackBtnHandler {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        showReactNativeFragment()
    }

    override fun invokeDefaultOnBackPressed() {
        TODO("Not yet implemented")
    }
}

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(
        text = "Hello $name!",
        modifier = modifier
    )
}

@Preview(showBackground = true)
@Composable
fun GreetingPreview() {
    BrownfieldIntegratedTesterTheme {
        Greeting("Android")
    }
}