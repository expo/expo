package host.exp.exponent.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import host.exp.expoview.R

@Composable
fun FeedbackScreen(
  viewModel: HomeAppViewModel = viewModel(),
  onGoBack: () -> Unit
) {
  val feedbackState by viewModel.feedbackState.collectAsState()
  var feedback by remember { mutableStateOf("") }
  var email by remember { mutableStateOf(viewModel.account.dataFlow.value?.bestContactEmail ?: "") }

  if (feedbackState.isSubmitted) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(16.dp),
      horizontalAlignment = Alignment.CenterHorizontally,
      verticalArrangement = Arrangement.Center
    ) {
      Icon(
        painter = painterResource(id = R.drawable.check),
        contentDescription = "Success",
        tint = MaterialTheme.colorScheme.primary,
        modifier = Modifier.size(80.dp)
      )
      Spacer(modifier = Modifier.height(24.dp))
      Text(
        text = "Thanks for sharing your feedback!",
        style = MaterialTheme.typography.headlineSmall,
        fontWeight = FontWeight.Bold,
        textAlign = TextAlign.Center
      )
      Spacer(modifier = Modifier.height(8.dp))
      Text(
        text = "Your feedback will help us make our app better.",
        style = MaterialTheme.typography.bodyLarge,
        textAlign = TextAlign.Center
      )
      Spacer(modifier = Modifier.height(24.dp))
      Button(onClick = {
        viewModel.resetFeedbackState()
        onGoBack()
      }, modifier = Modifier.fillMaxWidth()) {
        Text("Continue")
      }
    }
    return
  }

  Scaffold(
    topBar = {
      TopAppBarWithBackIcon("Feedback", onGoBack = onGoBack)
    }
  ) { padding ->
    Column(
      modifier = Modifier
        .padding(padding)
        .padding(horizontal = 16.dp, vertical = 8.dp)
        .verticalScroll(rememberScrollState())
    ) {
      Text(
        "Add your feedback to help us improve this app.",
        style = MaterialTheme.typography.bodyMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant
      )
      Spacer(modifier = Modifier.height(24.dp))

      Text(
        "Email (optional)",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold
      )
      Spacer(modifier = Modifier.height(8.dp))
      OutlinedTextField(
        value = email,
        onValueChange = { email = it },
        placeholder = { Text("your@email.com") },
        modifier = Modifier.fillMaxWidth(),
        enabled = !feedbackState.isSubmitting,
        singleLine = true
      )
      Spacer(modifier = Modifier.height(16.dp))

      Text(
        "Feedback",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold
      )
      Spacer(modifier = Modifier.height(8.dp))
      OutlinedTextField(
        value = feedback,
        onValueChange = { feedback = it },
        modifier = Modifier
          .fillMaxWidth()
          .height(200.dp),
        enabled = !feedbackState.isSubmitting
      )
      Spacer(modifier = Modifier.fillMaxHeight())
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .padding(16.dp)
      ) {
        feedbackState.error?.let {
          Text(
            text = "Something went wrong: $it",
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(bottom = 8.dp)
          )
        }
        Button(
          onClick = { viewModel.sendFeedback(feedback, email) },
          enabled = feedback.isNotBlank() && !feedbackState.isSubmitting,
          modifier = Modifier.fillMaxWidth()
        ) {
          if (feedbackState.isSubmitting) {
            CircularProgressIndicator(
              modifier = Modifier.size(24.dp),
              color = MaterialTheme.colorScheme.onPrimary
            )
          } else {
            Text("Submit")
          }
        }
      }
    }
  }
}
