package expo.modules.notifications

import android.content.Context
import android.content.SharedPreferences
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.Promise
import expo.modules.notifications.notifications.categories.ExpoNotificationCategoriesModule
import expo.modules.notifications.notifications.categories.NotificationActionRecord
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import java.io.IOException

@RunWith(RobolectricTestRunner::class)
class NotificationCategoriesModuleTest {
  private val context = mockk<Context>()
  private val preferences = mockk<SharedPreferences>()
  private val editor = mockk<SharedPreferences.Editor>()
  private val appContext = mockk<AppContext>()
  private val promise = mockk<Promise>(relaxed = true)
  private val module = object : ExpoNotificationCategoriesModule() {
    override val appContext: AppContext
      get() = this@NotificationCategoriesModuleTest.appContext
  }

  @Before
  fun setup() {
    every { appContext.reactContext } returns context
    every { context.getSharedPreferences(any(), any()) } returns preferences
    every { preferences.edit() } returns editor
    every { editor.remove(any()) } returns editor
    every { editor.putString(any(), any()) } returns editor
    every { editor.commit() } returns false
  }

  @Test
  fun `fetch rejects with the legacy code when preferences cannot be read`() {
    val failure = IllegalStateException("Preferences could not be read")
    every { preferences.all } throws failure

    val function = module.definition().asyncFunctions.getValue("getNotificationCategoriesAsync")
    val implementation = function.javaClass.declaredMethods.single { it.name.startsWith("callUserImplementation") }
    implementation.invoke(function, emptyArray<Any?>(), promise, appContext)

    verify { promise.reject("ERR_CATEGORIES_FETCH_FAILED", any(), failure) }
    verify(exactly = 0) { promise.resolve(any<Any>()) }
  }

  @Test
  fun `set rejects with the legacy code when commit fails and preserves validation errors`() {
    module.setNotificationCategoryAsync("category", listOf(NotificationActionRecord("action", "Action")), null, promise)

    verify { promise.reject("ERR_CATEGORY_SET_FAILED", any(), ofType<IOException>()) }
    verify(exactly = 0) { promise.resolve(any<Any>()) }
    assertThrows(InvalidArgumentException::class.java) {
      module.setNotificationCategoryAsync("invalid", emptyList(), null, promise)
    }
  }

  @Test
  fun `delete rejects with the legacy code when commit fails`() {
    every { preferences.contains(any()) } returns true

    module.deleteNotificationCategoryAsync("category", promise)

    verify { promise.reject("ERR_CATEGORY_DELETE_FAILED", any(), ofType<IOException>()) }
    verify(exactly = 0) { promise.resolve(any<Any>()) }
  }
}
