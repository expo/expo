package expo.ktlint

import com.pinterest.ktlint.rule.engine.core.api.editorconfig.INDENT_SIZE_PROPERTY
import com.pinterest.ktlint.test.KtLintAssertThat
import com.pinterest.ktlint.test.KtLintAssertThat.Companion.assertThatRule
import com.pinterest.ktlint.test.LintViolation
import org.junit.jupiter.api.Test

class IfBracesRuleTest {
  private val ifBracesRuleAssertThat = assertThatRule { IfBracesRule() }

  private fun assertThatCode(code: String): KtLintAssertThat =
    ifBracesRuleAssertThat(code).withEditorConfigOverride(INDENT_SIZE_PROPERTY to 2)

  @Test
  fun `adds braces to a single-line if statement`() {
    val code =
      """
      fun foo(a: Boolean) {
        if (a) return
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean) {
        if (a) {
          return
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolation(2, 10, "Missing { ... } around the if branch")
      .isFormattedAs(formattedCode)
  }

  @Test
  fun `adds braces to both branches of an if-else statement`() {
    val code =
      """
      fun foo(a: Boolean) {
        if (a) bar() else baz()
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean) {
        if (a) {
          bar()
        } else {
          baz()
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolations(
        LintViolation(2, 10, "Missing { ... } around the if branch"),
        LintViolation(2, 21, "Missing { ... } around the else branch")
      ).isFormattedAs(formattedCode)
  }

  @Test
  fun `adds braces to an if expression that returns a value`() {
    val code =
      """
      fun foo(a: Boolean) {
        val x = if (a) 1 else 2
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean) {
        val x = if (a) {
          1
        } else {
          2
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolations(
        LintViolation(2, 18, "Missing { ... } around the if branch"),
        LintViolation(2, 25, "Missing { ... } around the else branch")
      ).isFormattedAs(formattedCode)
  }

  @Test
  fun `keeps else-if chains and adds braces to every branch`() {
    val code =
      """
      fun foo(a: Boolean, b: Boolean) {
        if (a) x() else if (b) y() else z()
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean, b: Boolean) {
        if (a) {
          x()
        } else if (b) {
          y()
        } else {
          z()
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolations(
        LintViolation(2, 10, "Missing { ... } around the if branch"),
        LintViolation(2, 26, "Missing { ... } around the if branch"),
        LintViolation(2, 35, "Missing { ... } around the else branch")
      ).isFormattedAs(formattedCode)
  }

  @Test
  fun `adds braces to an else branch when the if branch already has them`() {
    val code =
      """
      fun foo(a: Boolean) {
        if (a) {
          x()
        } else y()
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean) {
        if (a) {
          x()
        } else {
          y()
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolation(4, 10, "Missing { ... } around the else branch")
      .isFormattedAs(formattedCode)
  }

  @Test
  fun `keeps a trailing comment inside the new block`() {
    val code =
      """
      fun foo(a: Boolean) {
        if (a) return // nothing to do
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean) {
        if (a) {
          return // nothing to do
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolation(2, 10, "Missing { ... } around the if branch")
      .isFormattedAs(formattedCode)
  }

  @Test
  fun `adds braces to a branch on the next line`() {
    val code =
      """
      fun foo(a: Boolean) {
        if (a)
          return
      }
      """.trimIndent()
    val formattedCode =
      """
      fun foo(a: Boolean) {
        if (a) {
          return
        }
      }
      """.trimIndent()
    assertThatCode(code)
      .hasLintViolation(3, 5, "Missing { ... } around the if branch")
      .isFormattedAs(formattedCode)
  }

  @Test
  fun `ignores if statements that already have braces`() {
    val code =
      """
      fun foo(a: Boolean) {
        if (a) {
          x()
        } else if (!a) {
          y()
        } else {
          z()
        }
      }
      """.trimIndent()
    assertThatCode(code).hasNoLintViolations()
  }

  @Test
  fun `ignores if expressions inside string templates`() {
    val code =
      """
      fun foo(a: Boolean) = "${'$'}{if (a) "yes" else "no"}"
      """.trimIndent()
    assertThatCode(code).hasNoLintViolations()
  }
}
