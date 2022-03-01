// copied from expo-modules-core
package expo.modules.test.core

import expo.modules.kotlin.Promise

enum class PromiseState {
  NONE,
  REJECTED,
  RESOLVED,
  ILLEGAL
}

class PromiseMock : Promise {

  var state = PromiseState.NONE

  var resolveValueSet: Boolean = false
  var resolveValue: Any? = null
    set(value) {
      this.resolveValueSet = true
      field = value
    }

  var rejectCodeSet: Boolean = false
  var rejectCode: String? = null
    set(value) {
      this.rejectCodeSet = true
      field = value
    }

  var rejectMessageSet: Boolean = false
  var rejectMessage: String? = null
    set(value) {
      this.rejectMessageSet = true
      field = value
    }

  var rejectThrowableSet: Boolean = false
  var rejectThrowable: Throwable? = null
    set(value) {
      this.rejectThrowableSet = true
      field = value
    }

  override fun resolve(value: Any?) {
    assertNotResolvedNorRejected()
    state = PromiseState.RESOLVED
    resolveValue = value
  }

  override fun reject(code: String, message: String?, cause: Throwable?) {
    assertNotResolvedNorRejected()
    state = PromiseState.REJECTED
    rejectCode = code
    rejectMessage = message
    rejectThrowable = cause
  }

  private fun assertNotResolvedNorRejected() {
    when (state) {
      PromiseState.RESOLVED,
      PromiseState.REJECTED,
      PromiseState.ILLEGAL -> {
        state = PromiseState.ILLEGAL
        throw IllegalStateException("Cannot resolve same promise twice!")
      }
      else -> {
      }
    }
  }
}
