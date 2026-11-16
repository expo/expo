package expo.ktlint

import com.pinterest.ktlint.test.KtLintAssertThat.Companion.assertThatRule
import com.pinterest.ktlint.test.LintViolation
import org.junit.jupiter.api.Test

class ObserveSharedImportsRuleTest {
  private val assertThatCode = assertThatRule { ObserveSharedImportsRule() }

  private fun violation(line: Int, import: String) =
    LintViolation(
      line,
      1,
      "`$import` is not allowed in `expo.modules.observe.shared`. Shared code must not depend on Expo modules or React Native. " +
        "Move the code that needs it to the glue package `expo.modules.observe`."
    )

  @Test
  fun `reports Expo and React Native imports in the shared package`() {
    val code =
      """
      package expo.modules.observe.shared.storage

      import android.content.Context
      import expo.modules.kotlin.modules.Module
      import expo.modules.core.interfaces.Package
      import expo.modules.interfaces.constants.ConstantsInterface
      import expo.modules.updatesinterface.UpdatesControllerRegistry
      import expo.modules.easclient.EASClientID
      import com.facebook.react.bridge.ReactMarker
      """.trimIndent()
    assertThatCode(code).hasLintViolationsWithoutAutoCorrect(
      violation(4, "expo.modules.kotlin.modules.Module"),
      violation(5, "expo.modules.core.interfaces.Package"),
      violation(6, "expo.modules.interfaces.constants.ConstantsInterface"),
      violation(7, "expo.modules.updatesinterface.UpdatesControllerRegistry"),
      violation(8, "expo.modules.easclient.EASClientID"),
      violation(9, "com.facebook.react.bridge.ReactMarker")
    )
  }

  @Test
  fun `reports star and aliased imports in the shared package`() {
    val code =
      """
      package expo.modules.observe.shared

      import expo.modules.kotlin.*
      import com.facebook.react.bridge.ReactMarker as Marker
      """.trimIndent()
    assertThatCode(code).hasLintViolationsWithoutAutoCorrect(
      violation(3, "expo.modules.kotlin.*"),
      violation(4, "com.facebook.react.bridge.ReactMarker")
    )
  }

  @Test
  fun `allows imports that only start with a forbidden package name`() {
    val code =
      """
      package expo.modules.observe.shared

      import android.content.Context
      import expo.modules.observe.shared.storage.SessionManager
      import expo.modules.kotlinx.Something
      import expo.modules.coreutils.Other
      import com.facebook.reactnative.Other
      """.trimIndent()
    assertThatCode(code).hasNoLintViolations()
  }

  @Test
  fun `ignores files outside the shared package`() {
    val code =
      """
      package expo.modules.observe

      import expo.modules.kotlin.modules.Module
      import com.facebook.react.bridge.ReactMarker
      """.trimIndent()
    assertThatCode(code).hasNoLintViolations()
  }

  @Test
  fun `ignores a package that only starts with the shared package name`() {
    val code =
      """
      package expo.modules.observe.sharedx

      import expo.modules.kotlin.modules.Module
      """.trimIndent()
    assertThatCode(code).hasNoLintViolations()
  }
}
