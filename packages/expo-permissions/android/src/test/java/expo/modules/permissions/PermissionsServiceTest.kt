package expo.modules.permissions

import android.Manifest
import android.content.pm.PackageManager
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.google.common.truth.Truth.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers
import org.mockito.Mockito.`when`
import org.mockito.Mockito.mock
import org.mockito.Mockito.reset
import org.mockito.Mockito.times
import org.mockito.Mockito.verify
import org.robolectric.RuntimeEnvironment
import org.unimodules.interfaces.permissions.PermissionsResponse
import org.unimodules.interfaces.permissions.PermissionsResponseListener
import org.unimodules.interfaces.permissions.PermissionsStatus

private val ANDROID_PERMISSIONS = arrayOf(
    Manifest.permission.CAMERA,
    Manifest.permission.READ_CALENDAR,
    Manifest.permission.WRITE_CALENDAR,
    Manifest.permission.RECORD_AUDIO,
    Manifest.permission.READ_SMS,
    Manifest.permission.ACCESS_COARSE_LOCATION,
    Manifest.permission.ACCESS_FINE_LOCATION
)

@RunWith(AndroidJUnit4::class)
class PermissionsServiceTest {

  private val mActivityDelegate = mock(ActivityDelegate::class.java)
  private val mPermissionsCacheDelegate = mock(PermissionsCacheDelegate::class.java)

  private fun generatePermissionsResponse(permissions: Array<String>, status: PermissionsStatus, canAskAgain: Boolean = true): Map<String, PermissionsResponse> {
    return permissions.zip(Array(permissions.size) { PermissionsResponse(status, canAskAgain) }).toMap()
  }

  @Before
  fun resetMock() {
    reset(mActivityDelegate)
    reset(mPermissionsCacheDelegate)

  }

  @Test
  fun `get undetermined permissions`() {
    `when`(mActivityDelegate.getPermission(ArgumentMatchers.anyString())).thenReturn(PackageManager.PERMISSION_DENIED)
    val permissionsService = PermissionsService(
        RuntimeEnvironment.systemContext,
        mPermissionsCacheDelegate,
        mActivityDelegate
    )
    val correctPermissionsResponse = generatePermissionsResponse(ANDROID_PERMISSIONS, PermissionsStatus.UNDETERMINED)

    permissionsService.getPermissions(PermissionsResponseListener { response ->
      assertThat(response).containsExactlyEntriesIn(correctPermissionsResponse)
    }, *ANDROID_PERMISSIONS)

    verify(mActivityDelegate, times(ANDROID_PERMISSIONS.size)).getPermission(ArgumentMatchers.anyString())
  }

  @Test
  fun `get granted permissions`() {
    `when`(mActivityDelegate.getPermission(ArgumentMatchers.anyString())).thenReturn(PackageManager.PERMISSION_GRANTED)
    val permissionsService = PermissionsService(
        RuntimeEnvironment.systemContext,
        mPermissionsCacheDelegate,
        mActivityDelegate
    )
    val correctPermissionsResponse = generatePermissionsResponse(ANDROID_PERMISSIONS, PermissionsStatus.GRANTED)

    permissionsService.getPermissions(PermissionsResponseListener { response ->
      assertThat(response).containsExactlyEntriesIn(correctPermissionsResponse)
    }, *ANDROID_PERMISSIONS)

    verify(mActivityDelegate, times(ANDROID_PERMISSIONS.size)).getPermission(ArgumentMatchers.anyString())
  }

  @Test
  fun `get denied permissions`() {
    `when`(mActivityDelegate.getPermission(ArgumentMatchers.anyString())).thenReturn(PackageManager.PERMISSION_DENIED)
    `when`(mPermissionsCacheDelegate.contains(ArgumentMatchers.anyString())).thenReturn(true)
    `when`(mActivityDelegate.canAskAgain(ArgumentMatchers.anyString())).thenReturn(true)
    val permissionsService = PermissionsService(
        RuntimeEnvironment.systemContext,
        mPermissionsCacheDelegate,
        mActivityDelegate
    )
    val correctPermissionsResponse = generatePermissionsResponse(ANDROID_PERMISSIONS, PermissionsStatus.DENIED)

    permissionsService.getPermissions(PermissionsResponseListener { response ->
      assertThat(response).containsExactlyEntriesIn(correctPermissionsResponse)
    }, *ANDROID_PERMISSIONS)

    verify(mActivityDelegate, times(ANDROID_PERMISSIONS.size)).getPermission(ArgumentMatchers.anyString())
  }

}
