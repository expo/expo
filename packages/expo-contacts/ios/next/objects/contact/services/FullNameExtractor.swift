import Contacts

class FullNameExtractor {
  static func extract(from contact: CNContact) -> String {
    let formatter = CNContactFormatter()
    formatter.style = .fullName
    return formatter.string(from: contact) ?? ""
  }
}
