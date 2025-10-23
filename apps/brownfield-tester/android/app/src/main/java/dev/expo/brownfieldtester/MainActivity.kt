package dev.expo.brownfieldtester

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Button
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import dev.expo.brownfieldtester.ui.theme.BrownfieldTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            BrownfieldTheme {
                val context = LocalContext.current
                Scaffold(modifier = Modifier.fillMaxSize()) { innerPadding ->
                    BrownfieldHome(
                        modifier = Modifier.padding(innerPadding),
                        onLaunchExpo = {
                            val intent = Intent(context, ExpoActivity::class.java)
                            ContextCompat.startActivity(context, intent, null)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun BrownfieldHome(
    modifier: Modifier = Modifier,
    onLaunchExpo: () -> Unit = {}
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = "Welcome to Brownfield Tester")
        Button(onClick = onLaunchExpo, modifier = Modifier.size(width = 220.dp, height = 54.dp)) {
            Text(text = "Open Expo Screen")
        }
    }
}

@Preview(showBackground = true)
@Composable
fun BrownfieldHomePreview() {
    BrownfieldTheme {
        BrownfieldHome()
    }
}