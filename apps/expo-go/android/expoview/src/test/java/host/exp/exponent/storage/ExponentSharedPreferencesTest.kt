package host.exp.exponent.storage

import android.content.Context
import androidx.core.content.edit
import host.exp.exponent.TestApplication
import host.exp.expoview.R
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = TestApplication::class)
class ExponentSharedPreferencesTest {
  private val context: Context = RuntimeEnvironment.getApplication()
  private val preferences = context.getSharedPreferences(
    context.getString(R.string.preference_file_key),
    Context.MODE_PRIVATE
  )

  @Test
  fun deletesTheLegacySessionOnInit() {
    preferences.edit(commit = true) { putString("expo_auth_session", """{"sessionSecret":"old"}""") }

    ExponentSharedPreferences(context)

    assertFalse(preferences.contains("expo_auth_session"))
  }
}
