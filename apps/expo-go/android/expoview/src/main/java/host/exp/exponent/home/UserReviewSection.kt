package host.exp.exponent.home

// path: /Users/aleqsio/Work/Expo/expoA/apps/expo-go/android/expoview/src/main/java/host/exp/exponent/home/UserReviewSection.kt

import android.app.Activity
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import host.exp.expoview.R

@Composable
fun UserReviewSection(
  viewModel: HomeAppViewModel = viewModel(),
  navigateToFeedback: () -> Unit
) {
  val userReviewState by viewModel.userReviewState.collectAsState()
  val context = LocalContext.current
  val activity = context as? Activity

  if (!userReviewState.shouldShow || !viewModel.isDevice) {
    return
  }

  Spacer(modifier = Modifier.height(16.dp))

  Card(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 16.dp),
    shape = RoundedCornerShape(12.dp),
    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
  ) {
    Column(modifier = Modifier.padding(16.dp)) {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
      ) {
        Text(
          text = "Enjoying Expo Go?",
          style = MaterialTheme.typography.titleMedium,
          fontWeight = FontWeight.Bold,
          modifier = Modifier.weight(1f)
        )
        IconButton(
          onClick = { viewModel.dismissReviewSection() },
          modifier = Modifier.size(24.dp)
        ) {
          Icon(
            painter = painterResource(id = R.drawable.close),
            contentDescription = "Dismiss"
          )
        }
      }
      Spacer(modifier = Modifier.height(8.dp))
      Text(
        text = "Whether you love the app or feel we could be doing better, let us know! Your feedback will help us improve.",
        style = MaterialTheme.typography.bodyMedium,
        modifier = Modifier.padding(bottom = 12.dp)
      )
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Button(
          onClick = {
            viewModel.provideFeedback()
            navigateToFeedback()
          },
          modifier = Modifier.weight(1f),
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
          shape = RoundedCornerShape(8.dp)
        ) {
          Text(
            text = "Not really",
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSecondaryContainer
          )
        }
        Button(
          onClick = {
            if (activity != null) {
              viewModel.requestStoreReview(activity)
            }
          },
          modifier = Modifier.weight(1f),
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
          shape = RoundedCornerShape(8.dp)
        ) {
          Text(
            text = "Love it!",
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSecondaryContainer
          )
        }
      }
    }
  }
}