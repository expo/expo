package host.exp.exponent.notifications

import android.content.Context
import com.facebook.react.bridge.BridgeReactContext
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.ModuleRegistry
import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import expo.modules.notifications.notifications.categories.NotificationCategoryRecord
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore
import host.exp.exponent.TestApplication
import host.exp.exponent.kernel.ExperienceKey
import io.mockk.every
import io.mockk.mockk
import java.lang.ref.WeakReference
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import versioned.host.exp.exponent.modules.universal.notifications.ScopedExpoNotificationCategoriesModule

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], application = TestApplication::class)
class ScopedNotificationCategoriesTest {
  private val context = RuntimeEnvironment.getApplication()
  private val store = SharedPreferencesNotificationCategoriesStore(context)
  private val module = ScopedExpoNotificationCategoriesModule(ExperienceKey("@expo/project"))
  private val appContext = mockk<AppContext>()
  private val action = NotificationActionRecord("reply", "Reply", NotificationActionRecord.TextInput("Type here"))

  @Before
  fun setup() {
    context.getSharedPreferences("expo.modules.notifications.SharedPreferencesNotificationCategoriesStore", Context.MODE_PRIVATE)
      .edit().clear().commit()
    every { appContext.reactContext } returns BridgeReactContext(context)
    ModuleRegistry(WeakReference(appContext)).register(module, null)
  }

  @Test
  fun `getter results can replace categories without changing their identifiers`() {
    store.saveNotificationCategory(NotificationCategoryRecord("EXPO_CATEGORY/other/keep", listOf(action)))
    module.setNotificationCategoriesAsync(listOf(NotificationCategoryRecord("reply/action", listOf(action))), mockk(relaxed = true))
    val result = CapturingPromise()
    ModuleHolder(module, null).call("getNotificationCategoriesAsync", emptyArray(), result)

    @Suppress("UNCHECKED_CAST")
    val categories = result.value as List<NotificationCategoryRecord>
    module.setNotificationCategoriesAsync(categories, mockk(relaxed = true))

    assertEquals(setOf("EXPO_CATEGORY/other/keep", "EXPO_CATEGORY/@expo/project/reply/action"), store.allNotificationCategories.map { it.identifier }.toSet())
    assertEquals(listOf(action), store.getNotificationCategory("EXPO_CATEGORY/@expo/project/reply/action")?.actions)
    assertEquals("reply/action", categories.single().identifier)
  }

  @Test
  fun `single setter results can replace categories without changing their identifiers`() {
    val result = CapturingPromise()
    module.setNotificationCategoryAsync("reply/action", listOf(action), null, result)
    val category = result.value as NotificationCategoryRecord
    module.setNotificationCategoriesAsync(listOf(category), mockk(relaxed = true))

    assertEquals(listOf(NotificationCategoryRecord("EXPO_CATEGORY/@expo/project/reply/action", listOf(action))), store.allNotificationCategories.toList())
    assertEquals("reply/action", category.identifier)
  }

  private class CapturingPromise : Promise {
    var value: Any? = null

    override fun resolve(value: Any?) {
      this.value = value
    }

    override fun reject(code: String?, message: String?, cause: Throwable?) = throw AssertionError(message, cause)
  }
}
