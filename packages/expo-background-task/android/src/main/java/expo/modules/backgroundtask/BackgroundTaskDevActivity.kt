package expo.modules.backgroundtask

import android.annotation.SuppressLint
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * This is a debug activity that can be used to test workers by setting
 * up this activity as the startup-activity. It will launch the worker as
 * if it was launched in the background by Android.
 * There is no UI in the activity - it is only used to be able to reliably
 * start and debug WorkManager workers.
 */
class BackgroundTaskDevActivity : AppCompatActivity() {
  @SuppressLint("SetTextI18n")
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    // Set up explanation texts
    val txtHeader = TextView(this).apply {
      text = "expo-background-task"
      textSize = 20f
      gravity = Gravity.CENTER
    }

    val txtDescription = TextView(this).apply {
      text = "This activity is a DEBUG activity for the expo-background-task library.\n" +
        "It lets you test your background tasks in a controlled environment. Use logcat to" +
             "see the output from running your tasks."
      textSize = 16f
      gravity = Gravity.CENTER
    }

    val button = Button(this).apply {
      text = "Run tasks"
      setOnClickListener {
        // Launch background tasks
        CoroutineScope(Dispatchers.Default).launch {
          BackgroundTaskService.launchHandler(applicationContext)
        }
      }
    }

    val linearLayout = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(32, 32, 32, 32)
    }

    // Add TextView to the FrameLayout
    linearLayout.addView(txtHeader)
    linearLayout.addView(txtDescription)
    linearLayout.addView(button)

    // Set the FrameLayout as the content view of the activity
    setContentView(linearLayout)
  }
}