import ExpoModulesCore

public final class InvalidAudioPolicyException: GenericException<String>, @unchecked Sendable {
  override public var reason: String {
    param
  }
}

public final class MediaSessionException: GenericException<String>, @unchecked Sendable {
  override public var reason: String {
    param
  }
}

public final class SessionUseEndedException: GenericException<String>, @unchecked Sendable {
  override public var reason: String {
    "\(param) awaited activation after its use of the audio session ended. Await activated() before ending the use, or begin a new use"
  }
}
