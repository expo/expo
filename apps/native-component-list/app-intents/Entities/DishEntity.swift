import AppIntents
import Foundation
internal import ExpoAppIntents

private func normalizeDishText(_ value: String) -> String {
  return value
    .folding(options: [.caseInsensitive, .diacriticInsensitive], locale: .current)
    .trimmingCharacters(in: .whitespacesAndNewlines)
}

struct DishEntity: AppEntity {
  static let typeDisplayRepresentation: TypeDisplayRepresentation = "Dish"
  static let defaultQuery = DishQuery()

  var id: String
  @Property(title: "Name")
  var name: String
  var subtitle: String?
  var synonyms: [String]

  var displayRepresentation: DisplayRepresentation {
    if let subtitle {
      if #available(iOS 17.0, *) {
        return DisplayRepresentation(
          title: "\(name)",
          subtitle: "\(subtitle)",
          synonyms: synonyms.map { LocalizedStringResource(stringLiteral: $0) }
        )
      }
      return DisplayRepresentation(title: "\(name)", subtitle: "\(subtitle)")
    }

    if #available(iOS 17.0, *) {
      return DisplayRepresentation(
        title: "\(name)",
        synonyms: synonyms.map { LocalizedStringResource(stringLiteral: $0) }
      )
    }
    return DisplayRepresentation(title: "\(name)")
  }

  init(record: AppIntentEntityRecord) {
    self.id = record.id
    self.subtitle = record.subtitle
    self.synonyms = record.synonyms
    self.name = record.title
  }

  private var searchableTerms: [String] {
    return [id, name] + synonyms
  }

  func matches(_ searchText: String) -> Bool {
    let normalizedSearch = normalizeDishText(searchText)
    guard !normalizedSearch.isEmpty else {
      return false
    }

    return searchableTerms.map(normalizeDishText).contains { term in
      normalizedSearch == term || normalizedSearch.contains(term) || term.contains(normalizedSearch)
    }
  }
}
