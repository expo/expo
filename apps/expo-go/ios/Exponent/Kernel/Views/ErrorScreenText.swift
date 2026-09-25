// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum ErrorScreenText {
  private static let markup = try? NSRegularExpression(pattern: #"\*\*(.*?)\*\*|\[(.*?)\]\((.*?)\)"#)
  private static let linkDetector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)

  static func attributed(_ text: String) -> AttributedString {
    let source = text as NSString
    var result = AttributedString()
    var cursor = 0
    for match in markup?.matches(in: text, range: NSRange(location: 0, length: source.length)) ?? [] {
      if match.range.location > cursor {
        result += linkified(source.substring(with: NSRange(location: cursor, length: match.range.location - cursor)))
      }
      if match.range(at: 1).location != NSNotFound {
        var bold = AttributedString(source.substring(with: match.range(at: 1)))
        bold.inlinePresentationIntent = .stronglyEmphasized
        result += bold
      } else {
        var link = AttributedString(source.substring(with: match.range(at: 2)))
        link.link = URL(string: source.substring(with: match.range(at: 3)))
        result += link
      }
      cursor = match.range.location + match.range.length
    }
    if cursor < source.length {
      result += linkified(source.substring(from: cursor))
    }
    return result
  }

  private static func linkified(_ text: String) -> AttributedString {
    var result = AttributedString(text)
    for match in linkDetector?.matches(in: text, range: NSRange(text.startIndex..., in: text)) ?? [] {
      guard let url = match.url,
            let range = Range(match.range, in: text),
            let attributedRange = Range(range, in: result) else {
        continue
      }
      result[attributedRange].link = url
    }
    return result
  }
}
