package expo.modules.kotlin.exception

class InvalidArgsNumberException(received: Int, expected: Int)
  : CodedException(message = "Received $received arguments, but $expected was expected.")
