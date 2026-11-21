package dev.expo.kudo.androidtest

import android.app.Application
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import androidx.activity.compose.setContent
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.mutableStateOf
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.facebook.react.runtime.ReactSurfaceView
import expo.embedding.ExpoHost
import expo.embedding.ExpoScene
import org.junit.Assert.assertSame
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.IOException
import java.util.concurrent.Semaphore
import java.util.concurrent.TimeUnit

@RunWith(AndroidJUnit4::class)
class ExpoSceneTest {
  private fun surface(view: View): ReactSurfaceView? {
    if (view is ReactSurfaceView) return view
    if (view is ViewGroup) {
      for (index in 0 until view.childCount) {
        surface(view.getChildAt(index))?.let { return it }
      }
    }
    return null
  }

  @Test
  fun shouldPreserveTheSurfaceWhenRecompositionCreatesANewPropsBundle() {
    val value = mutableStateOf(0)
    val committed = Semaphore(0)
    ActivityScenario.launch(MainActivity::class.java).use { scenario ->
      scenario.onActivity { activity ->
        val host = (activity.application as MainApplication).expo.host
        activity.setContent {
          ExpoScene(host, "Main", initialProps = Bundle().apply { putInt("value", value.value) })
          SideEffect { committed.release() }
        }
      }
      assertTrue(committed.tryAcquire(15, TimeUnit.SECONDS))
      lateinit var previous: ReactSurfaceView
      scenario.onActivity { activity ->
        previous = requireNotNull(surface(activity.window.decorView))
        value.value++
      }
      assertTrue(committed.tryAcquire(15, TimeUnit.SECONDS))
      scenario.onActivity { activity ->
        assertSame(previous, surface(activity.window.decorView))
      }
    }
  }

  @Test
  fun shouldExplainHowToRebuildAMissingEmbeddedBundle() {
    val testContext = InstrumentationRegistry.getInstrumentation().context
    val application = object : Application() {
      override fun getAssets() = testContext.assets
      override fun getApplicationInfo() = testContext.applicationInfo
    }
    val error = assertThrows(IllegalStateException::class.java) {
      ExpoHost(application, emptyList())
    }
    assertTrue(error.message!!.contains("index.android.bundle"))
    assertTrue(error.message!!.contains("rebuild"))
    assertTrue(error.cause is IOException)
  }
}
