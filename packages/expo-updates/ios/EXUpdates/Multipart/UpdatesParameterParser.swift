//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

/**
 * Derivation of ParameterParser class in the apache commons file upload
 * project: https://commons.apache.org/proper/commons-fileupload/
 *
 * A simple parser intended to parse sequences of name/value pairs.
 *
 * Parameter values are expected to be enclosed in quotes if they
 * contain unsafe characters, such as '=' characters or separators.
 * Parameter values are optional and can be omitted.
 */
public final class UpdatesParameterParser {
  private enum Constants {
    static let quote: Character = "\""
    static let backslash: Character = "\\"
    static let equals: Character = "="
  }

  private var parameterString: String = ""
  private var currentPosition: Int = 0
  private var tokenStart: Int = 0
  private var tokenEnd: Int = 0

  public init() {}

  public func parseParameterString(_ parameterString: String, withDelimiter delimiter: Character) -> [String: Any] {
    self.parameterString = parameterString
    self.currentPosition = 0

    var params = [String: Any]()

    let delimiterSet = CharacterSet(charactersIn: String(delimiter))
    let delimiterAndEqualsSet = CharacterSet(charactersIn: String(delimiter) + String(Constants.equals))

    while hasChar() {
      let paramName = parseToken(withTerminators: delimiterAndEqualsSet)
      var paramValue: Any?

      if hasChar() && currentChar() == Constants.equals {
        currentPosition += 1 // skip '='
        paramValue = parseQuotedToken(withTerminators: delimiterSet)
      }

      if hasChar() && currentChar() == delimiter {
        currentPosition += 1 // skip separator
      }

      if let paramName = paramName, !paramName.isEmpty {
        params[paramName] = paramValue ?? NSNull()
      }
    }

    return params
  }

  private func getToken(quoted: Bool) -> String? {
    guard let range = extractTokenRange(quoted: quoted) else { return nil }
    return String(parameterString[range])
  }

  private func extractTokenRange(quoted: Bool) -> Range<String.Index>? {
    var start = tokenStart
    var end = tokenEnd

    while start < end && parameterString[stringIndex(at: start)].isWhitespace {
      start += 1
    }

    while end > start && parameterString[stringIndex(at: end - 1)].isWhitespace {
      end -= 1
    }

    if quoted && (end - start) >= 2 {
      let startChar = parameterString[stringIndex(at: start)]
      let endChar = parameterString[stringIndex(at: end - 1)]
      if startChar == Constants.quote && endChar == Constants.quote {
        start += 1
        end -= 1
      }
    }

    guard end > start else {
      return nil
    }

    let startIndex = stringIndex(at: start)
    let endIndex = stringIndex(at: end)
    return startIndex..<endIndex
  }

  private func parseToken(withTerminators terminators: CharacterSet) -> String? {
    setTokenBounds()

    while hasChar() {
      let char = currentChar()
      guard let scalar = char.unicodeScalars.first, !terminators.contains(scalar) else {
        break
      }
      tokenEnd += 1
      currentPosition += 1
    }

    return getToken(quoted: false)
  }

  private func parseQuotedToken(withTerminators terminators: CharacterSet) -> String? {
    setTokenBounds()
    var quoted = false
    var charEscaped = false

    while hasChar() {
      let char = currentChar()

      if !quoted, let scalar = char.unicodeScalars.first, terminators.contains(scalar) {
        break
      }

      if !charEscaped && char == Constants.quote {
        quoted.toggle()
      }
      charEscaped = (!charEscaped && char == Constants.backslash)
      tokenEnd += 1
      currentPosition += 1
    }

    return getToken(quoted: true)
  }

  private func setTokenBounds() {
    tokenStart = currentPosition
    tokenEnd = currentPosition
  }

  private func hasChar() -> Bool {
    currentPosition < parameterString.count
  }

  private func currentChar() -> Character {
    parameterString[stringIndex(at: currentPosition)]
  }

  private func stringIndex(at position: Int) -> String.Index {
    parameterString.index(parameterString.startIndex, offsetBy: position)
  }
}
