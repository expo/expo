import Contacts
import Foundation

struct NonGregorianBirthdayMapper: PropertyMapper {
  typealias TDto = NonGregorianBirthday?
  
  var descriptor: CNKeyDescriptor { CNContactNonGregorianBirthdayKey as CNKeyDescriptor }

  func extract(from contact: CNContact) throws -> NonGregorianBirthday? {
    return toDto(value: contact.nonGregorianBirthday)
  }
  
  func apply(_ value: NonGregorianBirthday?, to contact: CNMutableContact) throws {
    contact.nonGregorianBirthday = toDomain(value: value)
  }
  
  private func toDomain(value: NonGregorianBirthday?) -> DateComponents? {
    guard let dto = value else {
      return nil
    }
    
    var components = DateComponents()
    
    if let dayInt = Int(dto.day) {
      components.day = dayInt
    }
    if let monthInt = Int(dto.month) {
      components.month = monthInt
    }
    if let yearString = dto.year, let yearInt = Int(yearString) {
      components.year = yearInt
    }
    
    components.calendar = Calendar(identifier: dto.calendar.toNativeIdentifier)
    
    return components
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
    
    let dto = NonGregorianBirthday()
    
    dto.day = String(format: "%02d", day)
    dto.month = String(format: "%02d", month)
    dto.year = components.year.map { String($0) }
    dto.calendar = supportedCalendar
    
    return dto
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
