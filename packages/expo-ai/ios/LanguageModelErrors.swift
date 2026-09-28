import ExpoModulesCore

internal final class LanguageModelException: Exception, @unchecked Sendable {
  private let errorCode: String
  private let message: String

  init(_ code: String, _ message: String) {
    self.errorCode = code
    self.message = message
    super.init()
  }

  override var code: String { errorCode }
  override var reason: String { message }

  static func cancelled() -> LanguageModelException {
    LanguageModelException("ERR_REQUEST_CANCELLED", "The language model request was cancelled.")
  }

  static func disposed() -> LanguageModelException {
    LanguageModelException("ERR_SESSION_DISPOSED", "The language model session has been disposed.")
  }

  static func invalid(_ message: String) -> LanguageModelException {
    LanguageModelException("ERR_INVALID_ARGUMENT", message)
  }
}
