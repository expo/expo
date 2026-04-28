// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Codable wrapper that picks the right `Session` subclass based on the encoded `type` field.

 Sessions are stored as `[Session]` on `Entry`, but the JSON decoder cannot know which
 subclass to instantiate from the array element type alone. This wrapper peeks at the `type`
 field, then decodes the same payload as the corresponding subclass.
 */
struct SessionCoder: Codable {
  let session: Session

  init(_ session: Session) {
    self.session = session
  }

  private enum TypeKey: String, CodingKey {
    case type
  }

  init(from decoder: any Decoder) throws {
    let container = try decoder.container(keyedBy: TypeKey.self)
    let type = try container.decodeIfPresent(Session.SessionType.self, forKey: .type) ?? .unknown
    switch type {
    case .main:
      self.session = try MainSession(from: decoder)
    case .foreground:
      self.session = try ForegroundSession(from: decoder)
    case .screen, .custom, .unknown:
      self.session = try Session(from: decoder)
    }
  }

  func encode(to encoder: any Encoder) throws {
    try session.encode(to: encoder)
  }
}
