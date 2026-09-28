import Foundation

func formatUpdateUrl(_ permalink: String, _ message: String) -> String {
  let updatePermalink = "url=\(permalink.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
  let updateMessage = "updateMessage=\(message.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")"
  return "expo-dev-client://expo-development-client?\(updatePermalink)&\(updateMessage)"
}

/// Updates published within `relativeCutoff` read as "2 hr. ago"; anything older reads as an
/// absolute date, since "8 mo. ago" stops being useful for telling old updates apart.
private enum UpdateDateFormatters {
  static let relativeCutoff: TimeInterval = 7 * 24 * 60 * 60

  static let iso8601WithFractionalSeconds: ISO8601DateFormatter = {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions.insert(.withFractionalSeconds)
    return formatter
  }()

  static let iso8601 = ISO8601DateFormatter()

  static let relative: RelativeDateTimeFormatter = {
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .short
    return formatter
  }()

  static let absolute: DateFormatter = {
    let formatter = DateFormatter()
    formatter.dateStyle = .medium
    formatter.timeStyle = .none
    return formatter
  }()
}

/// Formats an ISO 8601 update timestamp for display, returning `dateString` unchanged if it
/// cannot be parsed.
func formattedUpdateDate(_ dateString: String, relativeTo now: Date = .now) -> String {
  let date = UpdateDateFormatters.iso8601WithFractionalSeconds.date(from: dateString)
    ?? UpdateDateFormatters.iso8601.date(from: dateString)

  guard let date else {
    return dateString
  }

  guard now.timeIntervalSince(date) < UpdateDateFormatters.relativeCutoff else {
    return UpdateDateFormatters.absolute.string(from: date)
  }

  return UpdateDateFormatters.relative.localizedString(for: date, relativeTo: now)
}
