package host.exp.exponent.home


import android.app.Activity
import android.content.Context
import android.content.SharedPreferences
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
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.android.play.core.review.ReviewManagerFactory
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.TypeAdapter
import com.google.gson.stream.JsonReader
import com.google.gson.stream.JsonToken
import com.google.gson.stream.JsonWriter
import host.exp.exponent.Constants
import host.exp.exponent.graphql.Home_AccountAppsQuery
import host.exp.exponent.graphql.Home_AccountSnacksQuery
import host.exp.exponent.kernel.Kernel
import host.exp.expoview.R
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Date

private const val USER_REVIEW_INFO_PREFS = "userReviewInfo"

// Data class to store review-related information
private data class UserReviewInfo(
  val askedForNativeReviewDate: Date? = null,
  val lastDismissDate: Date? = null,
  val showFeedbackFormDate: Date? = null,
  val appOpenedCounter: Int = 0
)

// This class mimics the behavior of the useUserReviewCheck hook
private class UserReviewCheck(
  private val context: Context,
  private val onNavigateToFeedback: () -> Unit
) {
  var shouldShowReviewSection by mutableStateOf(false)
    private set

  private var userReviewInfo by mutableStateOf<UserReviewInfo>(UserReviewInfo())
  private var isStoreReviewAvailable by mutableStateOf(false)
  private var lastCrashDate by mutableStateOf<Date?>(null)

  private val gson: Gson = GsonBuilder()
    .registerTypeAdapter(Date::class.java, DateTypeAdapter())
    .create()

  private val prefs: SharedPreferences =
    context.getSharedPreferences(USER_REVIEW_INFO_PREFS, Context.MODE_PRIVATE)

  fun initialize(
    apps: List<Home_AccountAppsQuery.App>?,
    snacks: List<Home_AccountSnacksQuery.Snack>?
  ) {
    // Basic condition: only show on real devices
    if (!Constants.isDevice) {
      shouldShowReviewSection = false
      return
    }

    val timeNow = Date()
    val noRecentCrashes = lastCrashDate?.let { timeNow.time - it.time > 60 * 60 * 1000 } ?: true
    val noRecentDismisses =
      userReviewInfo.lastDismissDate?.let { timeNow.time - it.time > 15L * 24 * 60 * 60 * 1000 }
        ?: true

    shouldShowReviewSection = isStoreReviewAvailable &&
      userReviewInfo.askedForNativeReviewDate == null &&
      userReviewInfo.showFeedbackFormDate == null &&
      noRecentCrashes &&
      noRecentDismisses &&
      (userReviewInfo.appOpenedCounter >= 50 || (apps?.size ?: 0) >= 5 || (snacks?.size ?: 0) >= 5)
  }

  fun onForegrounded() {
    val lastCrash = Kernel.getLastCrashDate(context)
    lastCrashDate = lastCrash?.let { Date(it) }
  }

  suspend fun loadInitialData() {
    isStoreReviewAvailable = withContext(Dispatchers.IO) {
      try {
        ReviewManagerFactory.create(context) // Check availability
        true
      } catch (e: Exception) {
        false
      }
    }
    val infoJson = prefs.getString(USER_REVIEW_INFO_PREFS, null)
    val loadedInfo = infoJson?.let {
      gson.fromJson(it, UserReviewInfo::class.java)
    } ?: UserReviewInfo()

    val newInfo = loadedInfo.copy(appOpenedCounter = loadedInfo.appOpenedCounter + 1)
    updateUserReviewInfo(newInfo)
  }

  private fun updateUserReviewInfo(info: UserReviewInfo) {
    userReviewInfo = info
    val infoJson = gson.toJson(info)
    prefs.edit().putString(USER_REVIEW_INFO_PREFS, infoJson).apply()
  }

  fun requestStoreReview() {
    updateUserReviewInfo(userReviewInfo.copy(askedForNativeReviewDate = Date()))
    val manager = ReviewManagerFactory.create(context)
    manager.requestReviewFlow().addOnCompleteListener { task ->
      if (task.isSuccessful && context is Activity) {
        manager.launchReviewFlow(context, task.result)
      }
    }
  }

  fun dismissReviewSection() {
    updateUserReviewInfo(userReviewInfo.copy(lastDismissDate = Date()))
    // Hide the UI immediately
    shouldShowReviewSection = false
  }

  fun provideFeedback() {
    updateUserReviewI nfo (userReviewInfo.copy(showFeedbackFormDate = Date()))
    onNavigateToFeedback()
  }
}

@Composable
private fun rememberUserReviewCheck(onNavigateToFeedback: () -> Unit): UserReviewCheck {
  val context = LocalContext.current
  return remember { UserReviewCheck(context, onNavigateToFeedback) }
}

@Composable
fun UserReviewSection(
  apps: List<Home_AccountAppsQuery.App>?,
  snacks: List<Home_AccountSnacksQuery.Snack>?,
  onNavigateToFeedback: () -> Unit
) {
  val reviewCheck = rememberUserReviewCheck(onNavigateToFeedback)

  // Load initial data and set up foreground listener
  LaunchedEffect(Unit) {
    reviewCheck.loadInitialData()
    reviewCheck.onForegrounded() // Initial check
  }

  DisposableEffect(Unit) {
    val foregroundListener = Analytics.AnalyticsActivityLifecycleCallbacks() {
      reviewCheck.onForegrounded()
    }
    Analytics.addActivityLifecycleCallbacks(foregroundListener)

    onDispose {
      Analytics.removeActivityLifecycleCallbacks(foregroundListener)
    }
  }

  // Re-evaluate when data changes
  LaunchedEffect(apps, snacks, reviewCheck) {
    reviewCheck.initialize(apps, snacks)
  }

  if (!reviewCheck.shouldShowReviewSection) {
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
          style = MaterialTheme.typography.titleSmall,
          fontWeight = FontWeight.Bold
        )
        IconButton(
          onClick = { reviewCheck.dismissReviewSection() },
          modifier = Modifier.size(24.dp)
        ) {
          Icon(painter = painterResource(id = R.drawable.close), contentDescription = "Dismiss")
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
          onClick = { reviewCheck.provideFeedback() },
          modifier = Modifier.weight(1f),
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
          shape = RoundedCornerShape(8.dp)
        ) {
          Text("Not really", fontWeight = FontWeight.SemiBold)
        }
        Button(
          onClick = { reviewCheck.requestStoreReview() },
          modifier = Modifier.weight(1f),
          colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondaryContainer),
          shape = RoundedCornerShape(8.dp)
        ) {
          Text("Love it!", fontWeight = FontWeight.SemiBold)
        }
      }
    }
  }
}

// Simple GSON TypeAdapter for Date
private class DateTypeAdapter : TypeAdapter<Date>() {
  override fun write(out: JsonWriter, value: Date?) {
    if (value == null) {
      out.nullValue()
    } else {
      out.value(value.time)
    }
  }

  override fun read(`in`: JsonReader): Date? {
    if (`in`.peek() == JsonToken.NULL) {
      `in`.nextNull()
      return null
    }
    return Date(`in`.nextLong())
  }
}