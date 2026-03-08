package dev.expo.brownfieldintegratedtester.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.unit.dp
import dev.expo.brownfieldintegratedtester.StateActivity
import expo.modules.brownfield.BrownfieldState

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StateScreen() {
  // TODO(pmleczek): Replace with rememberSharedState once implemented
  // var time by rememberSharedState<String>("time-js", "")
  // var counter by rememberSharedState<Int>("counter", 0)
  var time by remember { mutableStateOf<String?>("") }
  var counter by remember { mutableStateOf<Int?>(0) }

  val context = LocalContext.current

  Scaffold(
      topBar = {
        TopAppBar(
            title = { Text("Shared State") },
            navigationIcon = {
              TextButton(onClick = { (context as? StateActivity)?.finish() }) {
                Text("← Back")
              }
            })
      }) { innerPadding ->
    Column(
        modifier =
            Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Time: ${time ?: ""}")
        Button(
            onClick = { BrownfieldState.delete("time-js") },
            modifier =
                Modifier
                    .testTag("js-time-delete")
                    .semantics { testTagsAsResourceId = true },
        ) {
          Text("Delete js-time state entry")
        }
      }

      Spacer(modifier = Modifier.height(8.dp))

      Column(
          verticalArrangement = Arrangement.spacedBy(12.dp),
          horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Text("${counter ?: 0}")
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
          Button(
              onClick = { counter = (counter ?: 0) + 1 },
              modifier =
                  Modifier
                      .testTag("counterIncrement")
                      .semantics { testTagsAsResourceId = true },
          ) {
            Text("+")
          }
          Button(
              onClick = { counter = (counter ?: 0) - 1 },
              modifier =
                  Modifier
                      .testTag("counterDecrement")
                      .semantics { testTagsAsResourceId = true },
          ) {
            Text("-")
          }
        }
      }
    }
  }
}
