import Contacts
import Foundation

struct NonGregorianBirthdayMapper: PropertyMapper {
  typealias TDto = NonGregorianBirthday?

  var descriptor: CNKeyDescriptor { CNContactNonGregorianBirthdayKey as CNKeyDescriptor }

  func extract(from contact: CNContact) throws -> NonGregorianBirthday? {
    return toDto(value: contact.nonGregorianBirthday)
  }

  func apply(_ value: NonGregorianBirthday?, to contact: CNMutableContact) throws {
    contact.nonGregorianBirthday = try toDomain(value: value)
  }

  private func toDomain(value: NonGregorianBirthday?) throws -> DateComponents? {
    guard let dto = value else {
      return nil
    }
    var dateComponents = try ContactDateNext(year: dto.year, month: dto.month, day: dto.day).toDateComponent()
    dateComponents.calendar = Calendar(identifier: dto.calendar.toNativeIdentifier)
    return dateComponents
  }

  private func toDto(value: DateComponents?) -> NonGregorianBirthday? {
    guard let components = value else {
      return nil
    }

    guard let calendarIdentifier = components.calendar?.identifier,
      let supportedCalendar = NonGregorianBirthdayCalendar.from(nativeIdentifier: calendarIdentifier) else {
      return nil
    }

    guard let month = components.month, let day = components.day else {
      return nil
    }

    return NonGregorianBirthday(
      year: components.year,
      month: month,
      day: day,
      calendar: supportedCalendar
    )
  }
}

extension NonGregorianBirthdayCalendar {
  var toNativeIdentifier: Calendar.Identifier {
    switch self {
    case .buddhist: return .buddhist
    case .chinese: return .chinese
    case .coptic: return .coptic
    case .ethiopicAmeteMihret: return .ethiopicAmeteMihret
    case .ethiopicAmeteAlem: return .ethiopicAmeteAlem
    case .hebrew: return .hebrew
    case .indian: return .indian
    case .islamic: return .islamic
    case .islamicCivil: return .islamicCivil
    case .japanese: return .japanese
    case .persian: return .persian
    case .republicOfChina: return .republicOfChina
    }
  }

  static func from(nativeIdentifier: Calendar.Identifier) -> NonGregorianBirthdayCalendar? {
    switch nativeIdentifier {
    case .buddhist: return .buddhist
    case .chinese: return .chinese
    case .coptic: return .coptic
    case .ethiopicAmeteMihret: return .ethiopicAmeteMihret
    case .ethiopicAmeteAlem: return .ethiopicAmeteAlem
    case .hebrew: return .hebrew
    case .indian: return .indian
    case .islamic: return .islamic
    case .islamicCivil: return .islamicCivil
    case .japanese: return .japanese
    case .persian: return .persian
    case .republicOfChina: return .republicOfChina
    default: return nil
    }
  }
}
