// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum ErrorScreenText {
  private static let boldPattern = try? NSRegularExpression(pattern: #"\*\*(.*?)\*\*"#)
  private static let linkPattern = try? NSRegularExpression(pattern: #"\[(.*?)\]\((.*?)\)"#)
  private static let linkDetector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)

  static func attributed(_ text: String) -> AttributedString {
    var result = AttributedString(text)
    applyBold(to: &result)
    applyLinks(to: &result)
    applyDetectedLinks(to: &result)
    return result
  }

  private static func applyBold(to string: inout AttributedString) {
    for match in matches(of: boldPattern, in: string).reversed() {
      guard let whole = range(match.range, in: string),
            let inner = range(match.range(at: 1), in: string) else {
        continue
      }
      var bold = AttributedString(string[inner])
      bold.inlinePresentationIntent = .stronglyEmphasized
      string.replaceSubrange(whole, with: bold)
    }
  }

  private static func applyLinks(to string: inout AttributedString) {
    for match in matches(of: linkPattern, in: string).reversed() {
      guard let whole = range(match.range, in: string),
            let label = range(match.range(at: 1), in: string),
            let target = range(match.range(at: 2), in: string) else {
        continue
      }
      var link = AttributedString(string[label])
      link.link = URL(string: String(string[target].characters))
      string.replaceSubrange(whole, with: link)
    }
  }

  private static func applyDetectedLinks(to string: inout AttributedString) {
    let plain = String(string.characters)
    for match in linkDetector?.matches(in: plain, range: NSRange(plain.startIndex..., in: plain)) ?? [] {
      guard let url = match.url,
            let matchRange = range(match.range, in: string),
            string[matchRange].runs.allSatisfy({ $0.link == nil }) else {
        continue
      }
      string[matchRange].link = url
    }
  }

  private static func matches(of pattern: NSRegularExpression?, in string: AttributedString) -> [NSTextCheckingResult] {
    let plain = String(string.characters)
    return pattern?.matches(in: plain, range: NSRange(plain.startIndex..., in: plain)) ?? []
  }

  private static func range(_ nsRange: NSRange, in string: AttributedString) -> Range<AttributedString.Index>? {
    let plain = String(string.characters)
    guard let stringRange = Range(nsRange, in: plain) else {
      return nil
    }
    let start = string.characters.index(string.startIndex, offsetBy: plain.distance(from: plain.startIndex, to: stringRange.lowerBound))
    let end = string.characters.index(start, offsetBy: plain.distance(from: stringRange.lowerBound, to: stringRange.upperBound))
    return start..<end
  }
}
