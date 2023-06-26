package abi49_0_0.host.exp.exponent.modules.api.components.reactnativestripesdk.utils

class PostalCodeUtilities {

  companion object {
    internal fun isValidGlobalPostalCodeCharacter(c: Char): Boolean {
      return Character.isLetterOrDigit(c) ||
        c.isWhitespace() ||
        c == '-'
    }

    internal fun isValidUsPostalCodeCharacter(c: Char): Boolean {
      return Character.isDigit(c) ||
        c.isWhitespace() ||
        c == '-'
    }
  }
}
