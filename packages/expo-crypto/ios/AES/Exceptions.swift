import ExpoModulesCore

final class InvalidKeySizeException : GenericException<Int>, @unchecked Sendable {
    override var reason: String {
        "Invalid key byte length: '\(param)'"
    }
}

final class InvalidKeyFormatException: Exception, @unchecked Sendable {
    override var reason: String {
        "Invalid key format provided"
    }
}

final class InvalidBase64Exception: Exception, @unchecked Sendable {
    override var reason: String {
        "Invalid base64 string"
    }
}

final class NonceGenerationFailedException: GenericException<Int>, @unchecked Sendable {
    override var reason: String {
        "Failed to generate IV of size '\(param)'"
    }
}

final class MissingEncodingException: Exception, @unchecked Sendable {
    override var reason: String {
        "Encoding argument must be provided for string inputs"
    }
}

