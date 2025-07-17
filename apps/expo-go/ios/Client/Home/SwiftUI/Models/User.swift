import Foundation

struct User: Identifiable {
  let id: String
  let username: String
  let email: String?
  let displayName: String?
  let profilePhoto: String?
  let accounts: [UserAccount]
}

struct UserAccount: Identifiable {
  let id: String
  let name: String
  let role: String?
}

extension User {
  static let mock = User(
    id: "1",
    username: "testuser",
    email: "test@example.com",
    displayName: "Test User",
    profilePhoto: "https://example.com/avatar.png",
    accounts: [
      UserAccount(id: "1", name: "testuser", role: "owner"),
      UserAccount(id: "2", name: "team-account", role: "member")
    ]
  )
}
