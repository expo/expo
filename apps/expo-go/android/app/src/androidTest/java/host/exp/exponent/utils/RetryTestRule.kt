package host.exp.exponent.utils

import org.junit.rules.TestRule
import org.junit.runner.Description
import org.junit.runners.model.Statement

class RetryTestRule(private val retryCount: Int) : TestRule {
  override fun apply(base: Statement, description: Description): Statement {
    return statement(base, description)
  }

  private fun statement(base: Statement, description: Description): Statement {
    return object : Statement() {
      @Throws(Throwable::class)
      override fun evaluate() {
        var caughtThrowable: Throwable? = null
        for (i in 0 until retryCount) {
          try {
            base.evaluate()
            return
          } catch (t: Throwable) {
            caughtThrowable = t
            System.err.println(description.displayName + ": run " + (i + 1) + " failed")
          }
        }
        System.err.println(description.displayName + ": giving up after " + retryCount + " failures")
        throw caughtThrowable!!
      }
    }
  }
}
