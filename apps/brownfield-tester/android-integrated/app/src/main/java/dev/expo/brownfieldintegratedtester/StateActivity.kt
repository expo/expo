package dev.expo.brownfieldintegratedtester

import android.os.Bundle
import dev.expo.brownfieldintegratedtester.ui.StateScreen
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.ui.Modifier
import dev.expo.brownfieldintegratedtester.ui.theme.BrownfieldIntegratedTesterTheme

class StateActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    setContent {
      BrownfieldIntegratedTesterTheme {
        StateScreen()
      }
    }
  }
}
