package expo.modules.kotlin.activityresult.activities

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity

class ImmediateVoidResultActivity : AppCompatActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    finish()
  }
}
