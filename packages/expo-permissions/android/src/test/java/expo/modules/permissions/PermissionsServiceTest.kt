package expo.modules.permissions

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import com.facebook.react.modules.core.PermissionListener
import com.google.common.truth.Truth.assertThat
import io.mockk.Runs
import io.mockk.clearMocks
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.verify
import io.mockk.verifyAll
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.JUnit4
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

@RunWith(JUnit4::class)
class PermissionsServiceTest {

  private val mActivityDelegate = mockk<PermissionsActivityDelegate>()
  private val mPermissionsCache = mockk<PermissionCache>()
  private val mContext = mockk<Context>()

  private fun generatePermissionsResponse(permissions: Array<String>, status: PermissionsStatus, canAskAgain: Boolean = true): Map<String, PermissionsResponse> {
    return permissions.zip(Array(permissions.size) { PermissionsResponse(status, canAskAgain) }).toMap()
  }

  @Before
  fun resetMock() {
    clearMocks(mActivityDelegate, mPermissionsCache, mContext)
  }

  @Test
  fun `gets permissions for the first time`() {
    getAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.UNDETERMINED, systemStatus = false, wasAsked = false, canAskAgain = true)
  }

  @Test
  fun `gets granted permissions`() {
    getAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.GRANTED, systemStatus = true, wasAsked = false, canAskAgain = true)
  }

  @Test
  fun `gets denied permissions`() {
    getAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.DENIED, systemStatus = false, wasAsked = true, canAskAgain = true)
  }

  @Test
  fun `gets denied permissions with canAksAgain set to false`() {
    getAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.DENIED, systemStatus = false, wasAsked = true, canAskAgain = false)
  }

  @Test
  fun `requests permissions and grants them`() {
    requestAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.GRANTED, userResponse = true, canAskAgain = true)
  }


  @Test
  fun `requests permissions and denies them but can ask again`() {
    requestAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.DENIED, userResponse = false, canAskAgain = true)
  }

  @Test
  fun `requests permissions and denies them but can't ask again`() {
    requestAndVerifyPermissions(ANDROID_PERMISSIONS, PermissionsStatus.DENIED, userResponse = false, canAskAgain = false)
  }

  private fun requestAndVerifyPermissions(permissions: Array<String>, expectedStatus: PermissionsStatus,
                                          userResponse: Boolean, canAskAgain: Boolean) {
    every { mActivityDelegate.askForPermissions(any(), any()) } answers {
      val permissionsToAsk = firstArg<Array<out String>>()
      secondArg<PermissionListener>().onRequestPermissionsResult(13, permissionsToAsk, IntArray(permissions.size) {
        if (userResponse) {
          PackageManager.PERMISSION_GRANTED
        } else {
          PackageManager.PERMISSION_DENIED
        }
      })
    }
    every { mPermissionsCache.add(any()) } just Runs
    every { mPermissionsCache.contains(any()) } returns true
    every { mActivityDelegate.canAskAgain(any()) } returns canAskAgain

    val permissionsService = PermissionsService(
        mContext,
        mPermissionsCache,
        mActivityDelegate
    )
    val correctPermissionsResponse = generatePermissionsResponse(permissions, expectedStatus, canAskAgain)


    permissionsService.askForPermissions(PermissionsResponseListener {
      assertThat(it).containsExactlyEntriesIn(correctPermissionsResponse)
    }, *permissions)


    verify(exactly = 1) {
      mActivityDelegate.askForPermissions(ANDROID_PERMISSIONS, any())
      mPermissionsCache.add(ANDROID_PERMISSIONS.toList())
    }

    if (expectedStatus == PermissionsStatus.GRANTED) {
      verify(exactly = 0) {
        mActivityDelegate.canAskAgain(any())
        mPermissionsCache.contains(any())
      }
    } else if (expectedStatus == PermissionsStatus.DENIED) {
      verify {
        ANDROID_PERMISSIONS.forEach {
          mActivityDelegate.canAskAgain(it)
          mPermissionsCache.contains(it)
        }
      }
    }
  }

  private fun getAndVerifyPermissions(permissions: Array<String>, expectedStatus: PermissionsStatus,
                                      systemStatus: Boolean, wasAsked: Boolean, canAskAgain: Boolean) {
    every { mActivityDelegate.getPermission(any()) } returns if (systemStatus) {
      PackageManager.PERMISSION_GRANTED
    } else {
      PackageManager.PERMISSION_DENIED
    }
    every { mPermissionsCache.contains(any()) } returns wasAsked
    every { mActivityDelegate.canAskAgain(any()) } returns canAskAgain

    val permissionsService = PermissionsService(
        mContext,
        mPermissionsCache,
        mActivityDelegate
    )
    val correctPermissionsResponse = generatePermissionsResponse(permissions, expectedStatus, canAskAgain)

    permissionsService.getPermissions(PermissionsResponseListener {
      assertThat(it).containsExactlyEntriesIn(correctPermissionsResponse)
    }, *permissions)

    verify(exactly = 0) {
      if (expectedStatus == PermissionsStatus.GRANTED) {
        mPermissionsCache.contains(any())
      }
      mPermissionsCache.add(any())
    }

    verifyAll {
      ANDROID_PERMISSIONS.forEach {
        mActivityDelegate.getPermission(it)
        if (expectedStatus == PermissionsStatus.UNDETERMINED) {
          mPermissionsCache.contains(it)
        } else if (expectedStatus == PermissionsStatus.DENIED) {
          mPermissionsCache.contains(it)
          mActivityDelegate.canAskAgain(it)
        }
      }
    }
  }
}
