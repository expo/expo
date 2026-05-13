package expo.modules.adapters.react.permissions

import android.Manifest
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth.assertThat
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsStatus
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
class PermissionsServiceTest {
  private lateinit var context: Context
  private lateinit var preferences: SharedPreferences
  private lateinit var permissionsService: TestPermissionsService

  @Before
  fun setUp() {
    context = ApplicationProvider.getApplicationContext()
    preferences = context.getSharedPreferences(PREFERENCE_FILENAME, Context.MODE_PRIVATE)
    preferences.edit().clear().commit()
    permissionsService = TestPermissionsService(context)
  }

  @Test
  fun `returns undetermined for denied permission that was never requested`() {
    permissionsService.manifestPermissionResult = PackageManager.PERMISSION_DENIED

    val response = permissionsService.getPermission()

    assertThat(response.status).isEqualTo(PermissionsStatus.UNDETERMINED)
    assertThat(response.canAskAgain).isTrue()
  }

  @Test
  fun `returns denied for denied permission that was last denied by the user`() {
    markPermissionAsAsked(wasGranted = false)
    permissionsService.manifestPermissionResult = PackageManager.PERMISSION_DENIED

    val response = permissionsService.getPermission()

    assertThat(response.status).isEqualTo(PermissionsStatus.DENIED)
    assertThat(response.canAskAgain).isFalse()
  }

  @Test
  fun `returns undetermined for denied permission that was granted before`() {
    markPermissionAsAsked(wasGranted = true)
    permissionsService.manifestPermissionResult = PackageManager.PERMISSION_DENIED

    val response = permissionsService.getPermission()

    assertThat(response.status).isEqualTo(PermissionsStatus.UNDETERMINED)
    assertThat(response.canAskAgain).isTrue()
  }

  @Test
  fun `returns granted for granted permission that was granted before`() {
    markPermissionAsAsked(wasGranted = true)
    permissionsService.manifestPermissionResult = PackageManager.PERMISSION_GRANTED

    val response = permissionsService.getPermission()

    assertThat(response.status).isEqualTo(PermissionsStatus.GRANTED)
    assertThat(response.canAskAgain).isTrue()
  }

  private fun markPermissionAsAsked(wasGranted: Boolean) {
    preferences.edit()
      .putBoolean(RECORD_AUDIO, true)
      .putBoolean("$RECORD_AUDIO$PERMISSION_GRANTED_PREFERENCE_SUFFIX", wasGranted)
      .commit()
  }

  private fun TestPermissionsService.getPermission(): PermissionsResponse {
    var response: PermissionsResponse? = null
    getPermissions({ permissionsMap ->
      response = permissionsMap[RECORD_AUDIO]
    }, RECORD_AUDIO)
    return requireNotNull(response)
  }

  private class TestPermissionsService(context: Context) : PermissionsService(context) {
    var manifestPermissionResult: Int = PackageManager.PERMISSION_DENIED

    override fun getManifestPermissionFromContext(permission: String): Int = manifestPermissionResult
  }

  private companion object {
    const val PREFERENCE_FILENAME = "expo.modules.permissions.asked"
    const val PERMISSION_GRANTED_PREFERENCE_SUFFIX = ".granted"
    const val RECORD_AUDIO = Manifest.permission.RECORD_AUDIO
  }
}
