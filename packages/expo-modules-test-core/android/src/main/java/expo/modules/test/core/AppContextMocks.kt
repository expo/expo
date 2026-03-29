package expo.modules.test.core

import android.content.Context
import androidx.test.core.app.ApplicationProvider
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.sharedobjects.SharedObject
import io.mockk.mockk
import java.lang.ref.WeakReference

fun createMockAppContext(): AppContext {
  val reactContext = BridgeReactContext(ApplicationProvider.getApplicationContext<Context>())
  return AppContext(
    modulesProvider = mockk(relaxed = true),
    legacyModuleRegistry = mockk(relaxed = true),
    reactContextHolder = WeakReference(reactContext)
  )
}

fun <T : SharedObject> T.withMockAppContext(): T = apply {
  val appContext = createMockAppContext()
  runtimeContextHolder = WeakReference(appContext.runtime)
}
