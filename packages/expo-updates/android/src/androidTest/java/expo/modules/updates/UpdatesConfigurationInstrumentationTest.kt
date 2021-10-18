package expo.modules.updates

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.os.Bundle
import org.junit.Assert
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito
import org.mockito.runners.MockitoJUnitRunner

@RunWith(MockitoJUnitRunner::class)
class UpdatesConfigurationInstrumentationTest {
  var packageName = "test"
  var runtimeVersion = "3.14"
  @Test
  @Throws(PackageManager.NameNotFoundException::class)
  fun testLoadValuesFromMetadata_stripsPrefix() {
    val metaData = Bundle().apply {
      putString(
        "expo.modules.updates.EXPO_RUNTIME_VERSION",
        String.format("string:%s", runtimeVersion)
      )
    }
    val mockAi = Mockito.mock(ApplicationInfo::class.java)
    mockAi.metaData = metaData
    val packageManager = Mockito.mock(
      PackageManager::class.java
    )
    Mockito.`when`(packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA))
      .thenReturn(mockAi)
    val context = Mockito.mock(
      Context::class.java
    )
    Mockito.`when`(context.packageName).thenReturn(packageName)
    Mockito.`when`(context.packageManager).thenReturn(packageManager)
    var config = UpdatesConfiguration()
    config = config.loadValuesFromMetadata(context)
    Assert.assertEquals(runtimeVersion, config.runtimeVersion)
  }

  @Test
  @Throws(PackageManager.NameNotFoundException::class)
  fun testLoadValuesFromMetadata_worksWithoutPrefix() {
    val metaData = Bundle().apply {
      putString("expo.modules.updates.EXPO_RUNTIME_VERSION", runtimeVersion)
    }
    val mockAi = Mockito.mock(ApplicationInfo::class.java)
    mockAi.metaData = metaData
    val packageManager = Mockito.mock(
      PackageManager::class.java
    )
    Mockito.`when`(packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA))
      .thenReturn(mockAi)
    val context = Mockito.mock(
      Context::class.java
    )
    Mockito.`when`(context.packageName).thenReturn(packageName)
    Mockito.`when`(context.packageManager).thenReturn(packageManager)
    var config = UpdatesConfiguration()
    config = config.loadValuesFromMetadata(context)
    Assert.assertEquals(runtimeVersion, config.runtimeVersion)
  }
}
