// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

/// Lightweight JavaScript/TypeScript syntax highlighter
struct SyntaxHighlighter {

  struct Theme {
    let keyword: Color
    let string: Color
    let number: Color
    let comment: Color
    let punctuation: Color
    let property: Color
    let plain: Color
    let background: Color
    let lineNumber: Color

    static var light: Theme {
      Theme(
        keyword: Color(red: 0.67, green: 0.05, blue: 0.57),   // purple
        string: Color(red: 0.77, green: 0.10, blue: 0.09),    // red
        number: Color(red: 0.11, green: 0.44, blue: 0.69),    // blue
        comment: Color(red: 0.42, green: 0.47, blue: 0.44),   // gray
        punctuation: Color(red: 0.31, green: 0.31, blue: 0.31),
        property: Color(red: 0.15, green: 0.44, blue: 0.56),  // teal
        plain: Color(red: 0.15, green: 0.15, blue: 0.15),
        background: Color(red: 0.98, green: 0.98, blue: 0.98),
        lineNumber: Color(red: 0.6, green: 0.6, blue: 0.6)
      )
    }

    static var dark: Theme {
      Theme(
        keyword: Color(red: 0.78, green: 0.56, blue: 0.90),   // purple
        string: Color(red: 0.80, green: 0.58, blue: 0.46),    // orange
        number: Color(red: 0.71, green: 0.84, blue: 0.65),    // green
        comment: Color(red: 0.50, green: 0.55, blue: 0.52),   // gray
        punctuation: Color(red: 0.80, green: 0.80, blue: 0.80),
        property: Color(red: 0.61, green: 0.80, blue: 0.92),  // light blue
        plain: Color(red: 0.92, green: 0.92, blue: 0.92),
        background: Color(red: 0.11, green: 0.12, blue: 0.13),
        lineNumber: Color(red: 0.45, green: 0.45, blue: 0.45)
      )
    }
  }

  private static let keywords = Set([
    "async", "await", "break", "case", "catch", "class", "const", "continue",
    "debugger", "default", "delete", "do", "else", "enum", "export", "extends",
    "false", "finally", "for", "from", "function", "if", "implements", "import",
    "in", "instanceof", "interface", "let", "new", "null", "of", "package",
    "private", "protected", "public", "return", "static", "super", "switch",
    "this", "throw", "true", "try", "type", "typeof", "undefined", "var",
    "void", "while", "with", "yield"
  ])

  private static let punctuationChars: Set<Character> = Set("{}[]();:,.<>+-*/%=!&|?@#~^")

  enum TokenType {
    case keyword, string, number, comment, punctuation, property, plain

    func color(in theme: Theme) -> Color {
      switch self {
      case .keyword: return theme.keyword
      case .string: return theme.string
      case .number: return theme.number
      case .comment: return theme.comment
      case .punctuation: return theme.punctuation
      case .property: return theme.property
      case .plain: return theme.plain
      }
    }
  }

  struct Token {
    let text: String
    let type: TokenType
  }

  static func tokenize(_ code: String) -> [Token] {
    var tokens: [Token] = []
    var index = code.startIndex

    while index < code.endIndex {
      let remaining = code[index...]

      // Single-line comment
      if remaining.hasPrefix("//") {
        let end = remaining.firstIndex(of: "\n") ?? remaining.endIndex
        tokens.append(Token(text: String(remaining[..<end]), type: .comment))
        index = end
        continue
      }

      // Multi-line comment
      if remaining.hasPrefix("/*") {
        if let endRange = remaining.range(of: "*/") {
          let end = endRange.upperBound
          tokens.append(Token(text: String(remaining[..<end]), type: .comment))
          index = end
          continue
        }
      }

      // Strings
      let quote = remaining.first
      if quote == "\"" || quote == "'" || quote == "`" {
        var end = remaining.index(after: index)
        var escaped = false
        while end < remaining.endIndex {
          let char = remaining[end]
          if escaped {
            escaped = false
          } else if char == "\\" {
            escaped = true
          } else if char == quote {
            end = remaining.index(after: end)
            break
          } else if quote != "`" && char == "\n" {
            break
          }
          end = remaining.index(after: end)
        }
        tokens.append(Token(text: String(remaining[index..<end]), type: .string))
        index = end
        continue
      }

      // Numbers
      let char = remaining.first!
      if char.isNumber || (char == "." && remaining.dropFirst().first?.isNumber == true) {
        var end = index
        var hasDecimal = char == "."
        while end < remaining.endIndex {
          let c = remaining[end]
          if c.isNumber {
            end = remaining.index(after: end)
          } else if c == "." && !hasDecimal {
            hasDecimal = true
            end = remaining.index(after: end)
          } else if c == "x" || c == "X" || c == "e" || c == "E" ||
                    c == "b" || c == "B" || c == "o" || c == "O" ||
                    (c >= "a" && c <= "f") || (c >= "A" && c <= "F") {
            end = remaining.index(after: end)
          } else {
            break
          }
        }
        tokens.append(Token(text: String(remaining[index..<end]), type: .number))
        index = end
        continue
      }

      // Identifiers and keywords
      if char.isLetter || char == "_" || char == "$" {
        var end = index
        while end < remaining.endIndex {
          let c = remaining[end]
          if c.isLetter || c.isNumber || c == "_" || c == "$" {
            end = remaining.index(after: end)
          } else {
            break
          }
        }
        let word = String(remaining[index..<end])
        let type: TokenType = keywords.contains(word) ? .keyword : .plain
        tokens.append(Token(text: word, type: type))
        index = end
        continue
      }

      // Punctuation
      if punctuationChars.contains(char) {
        tokens.append(Token(text: String(char), type: .punctuation))
        index = remaining.index(after: index)
        continue
      }

      // Whitespace and other
      tokens.append(Token(text: String(char), type: .plain))
      index = remaining.index(after: index)
    }

    return tokens
  }

  static func highlight(_ code: String, theme: Theme) -> AttributedString {
    let tokens = tokenize(code)
    var result = AttributedString()

    for token in tokens {
      var attributed = AttributedString(token.text)
      attributed.foregroundColor = token.type.color(in: theme)
      result.append(attributed)
    }

    return result
  }

  static func highlightLines(_ lines: [String], theme: Theme) async -> [AttributedString] {
    lines.map { line in
      highlight(line.isEmpty ? " " : line, theme: theme)
    }
  }
}
