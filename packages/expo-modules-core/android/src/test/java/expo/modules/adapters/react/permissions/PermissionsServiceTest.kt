package expo.modules.adapters.react.permissions

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import androidx.test.core.app.ApplicationProvider
import com.google.common.truth.Truth
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.permissions.PermissionsResponse
import expo.modules.interfaces.permissions.PermissionsResponseListener
import expo.modules.interfaces.permissions.PermissionsStatus
import io.mockk.every
import io.mockk.mockk
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

private const val PREFERENCE_FILENAME = "expo.modules.permissions.asked"
private const val BLOCKED_PERMISSION_KEY_PREFIX = "blocked:"
private const val CAMERA = Manifest.permission.CAMERA

private class FakePermissionsService(context: Context) : PermissionsService(context) {
  var grantState: Int = PackageManager.PERMISSION_DENIED
  var rationale: Boolean = false

  var requestOutcome: Int = PackageManager.PERMISSION_DENIED

  override fun getManifestPermissionFromContext(permission: String): Int = grantState

  override fun shouldShowRequestPermissionRationale(permission: String): Boolean = rationale

  override fun askForManifestPermissions(
    permissions: Array<out String>,
    listener: PermissionsResponseListener
  ) {
    grantState = requestOutcome
    context.getSharedPreferences(PREFERENCE_FILENAME, Context.MODE_PRIVATE)
      .edit().apply { permissions.forEach { putBoolean(it, true) } }.commit()
    val granted = requestOutcome == PackageManager.PERMISSION_GRANTED
    val result = permissions.associateWith {
      PermissionsResponse(if (granted) PermissionsStatus.GRANTED else PermissionsStatus.DENIED)
    }
    listener.onResult(result)
  }
}

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30])
internal class PermissionsServiceTest {
  private lateinit var context: Context

  @Before
  fun setUp() {
    context = ApplicationProvider.getApplicationContext()
    prefs().edit().clear().commit()
  }

  private fun prefs() = context.getSharedPreferences(PREFERENCE_FILENAME, Context.MODE_PRIVATE)

  private fun createService(): FakePermissionsService {
    val service = FakePermissionsService(context)
    val activityProvider = mockk<ActivityProvider> { every { currentActivity } returns null }
    val uiManager = mockk<UIManager>(relaxed = true)
    val registry = mockk<ModuleRegistry> {
      every { getModule(ActivityProvider::class.java) } returns activityProvider
      every { getModule(UIManager::class.java) } returns uiManager
    }
    service.onCreate(registry)
    return service
  }

  private fun markAsked(permission: String) =
    prefs().edit().putBoolean(permission, true).commit()

  private fun markBlocked(permission: String) =
    prefs().edit().putBoolean("$BLOCKED_PERMISSION_KEY_PREFIX$permission", true).commit()

  private fun getPermission(service: PermissionsService, permission: String): PermissionsResponse {
    var result: Map<String, PermissionsResponse>? = null
    service.getPermissions({ result = it }, permission)
    return result!!.getValue(permission)
  }

  private fun askPermission(service: PermissionsService, permission: String) {
    service.askForPermissions({}, permission)
  }

  @Test
  fun `denied permission that was asked but never blocked can be asked again`() {
    markAsked(CAMERA)
    val service = createService().apply { grantState = PackageManager.PERMISSION_DENIED }

    val response = getPermission(service, CAMERA)

    Truth.assertThat(response.status).isEqualTo(PermissionsStatus.DENIED)
    Truth.assertThat(response.canAskAgain).isTrue()
  }

  @Test
  fun `request denied with no rationale blocks further asks`() {
    val service = createService().apply {
      rationale = false
      requestOutcome = PackageManager.PERMISSION_DENIED
    }

    askPermission(service, CAMERA)
    val response = getPermission(service, CAMERA)

    Truth.assertThat(response.status).isEqualTo(PermissionsStatus.DENIED)
    Truth.assertThat(response.canAskAgain).isFalse()
  }

  @Test
  fun `request denied with rationale keeps permission askable`() {
    val service = createService().apply {
      rationale = true
      requestOutcome = PackageManager.PERMISSION_DENIED
    }

    askPermission(service, CAMERA)
    val response = getPermission(service, CAMERA)

    Truth.assertThat(response.canAskAgain).isTrue()
  }

  @Test
  fun `granting a previously blocked permission makes it askable again`() {
    markBlocked(CAMERA)
    val service = createService().apply { requestOutcome = PackageManager.PERMISSION_GRANTED }

    askPermission(service, CAMERA)

    service.grantState = PackageManager.PERMISSION_DENIED
    markAsked(CAMERA)
    val response = getPermission(service, CAMERA)

    Truth.assertThat(response.canAskAgain).isTrue()
  }
}
