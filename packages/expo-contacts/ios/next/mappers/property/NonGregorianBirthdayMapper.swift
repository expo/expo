import Contacts
import Foundation

struct NonGregorianBirthdayMapper: PropertyMapper {
  typealias TDomain = DateComponents?
  typealias TDto = NonGregorianBirthday?
  
  func toDomain(value: NonGregorianBirthday?) -> DateComponents? {
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
  
  func toDto(value: DateComponents?) -> NonGregorianBirthday? {
    guard let components = value else {
      return nil
    }
    
    guard let calendarIdentifier = components.calendar?.identifier,
          let supportedCalendar = NonGregorianBirthdayCalendar.from(nativeIdentifier: calendarIdentifier) else {
      return nil
    }
    
    let dto = NonGregorianBirthday()
    
    if let day = components.day {
      dto.day = String(day)
    } else {
      dto.day = "1"
    }
    
    if let month = components.month {
      dto.month = String(month)
    } else {
      dto.month = "1"
    }
    
    if let year = components.year {
      dto.year = String(year)
    }
    
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

