import Contacts

class CNContactSortOrderMapper {
  static func map(_ sortOrder: SortOrder) -> CNContactSortOrder{
    switch sortOrder {
    case .givenName:
      return .givenName
    case .familyName:
      return .familyName
    case .none:
      return .none
    case .userDefault:
      return .userDefault
    }
  }
}
