// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel

private const val MAX_LENGTH = 600

class ExponentErrorMessage(
  private var userErrorMessage: String?,
  private val developerErrorMessage: String?
) {
  fun userErrorMessage(): String {
    return userErrorMessage?.let { limit(it) } ?: ""
  }

  fun developerErrorMessage(): String {
    return developerErrorMessage?.let { limit(it) } ?: ""
  }

  fun addUserErrorMessage(errorMessage: String?): ExponentErrorMessage {
    userErrorMessage = errorMessage
    return this
  }

  private fun limit(s: String): String {
    return if (s.length < MAX_LENGTH) {
      s
    } else {
      s.substring(0, MAX_LENGTH)
    }
  }

  companion object {
    @JvmStatic fun userErrorMessage(errorMessage: String?): ExponentErrorMessage {
      return ExponentErrorMessage(errorMessage, errorMessage)
    }

    @JvmStatic fun developerErrorMessage(errorMessage: String?): ExponentErrorMessage {
      return ExponentErrorMessage(null, errorMessage)
    }
  }
}
