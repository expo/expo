// Copyright 2015-present 650 Industries. All rights reserved.

internal enum RemoteUpdateError: Error {
  case directiveParsingError
  case invalidDirectiveType
}

internal final class SigningInfo {
  let easProjectId: String
  let scopeKey: String

  required init(easProjectId: String, scopeKey: String) {
    self.easProjectId = easProjectId
    self.scopeKey = scopeKey
  }
}

@objc(EXUpdatesUpdateDirective)
public class UpdateDirective: NSObject {
  let signingInfo: SigningInfo?

  init(signingInfo: SigningInfo?) {
    self.signingInfo = signingInfo
  }

  static func fromJSONData(_ jsonData: Data) throws -> UpdateDirective {
    let jsonRaw = try JSONSerialization.jsonObject(with: jsonData)
    guard let json = jsonRaw as? [String: Any] else {
      throw RemoteUpdateError.directiveParsingError
    }

    let extraDict: [String: Any]? = json.optionalValue(forKey: "extra")
    let signingInfoDict: [String: Any]? = extraDict?.optionalValue(forKey: "signingInfo")
    let signingInfo = signingInfoDict.let { it in
      SigningInfo(easProjectId: it.requiredValue(forKey: "projectId"), scopeKey: it.requiredValue(forKey: "scopeKey"))
    }

    let messageType: String = json.requiredValue(forKey: "type")

    switch messageType {
    case "noUpdateAvailable":
      return NoUpdateAvailableUpdateDirective(signingInfo: signingInfo)
    case "rollBackToEmbedded":
      let parametersDict: [String: Any] = json.requiredValue(forKey: "parameters")
      let commitTimeString: String = parametersDict.requiredValue(forKey: "commitTime")
      guard let commitTime = RCTConvert.nsDate(commitTimeString) else {
        throw RemoteUpdateError.directiveParsingError
      }
      return RollBackToEmbeddedUpdateDirective(commitTime: commitTime, signingInfo: signingInfo)
    default:
      throw RemoteUpdateError.invalidDirectiveType
    }
  }
}

public final class NoUpdateAvailableUpdateDirective: UpdateDirective {}

@objc(EXUpdatesRollBackToEmbeddedUpdateDirective)
public final class RollBackToEmbeddedUpdateDirective: UpdateDirective {
  let commitTime: Date

  required init(commitTime: Date, signingInfo: SigningInfo?) {
    self.commitTime = commitTime
    super.init(signingInfo: signingInfo)
  }
}

internal class UpdateResponsePart {}

internal final class DirectiveUpdateResponsePart: UpdateResponsePart {
  let updateDirective: UpdateDirective

  required init(updateDirective: UpdateDirective) {
    self.updateDirective = updateDirective
  }
}

internal final class ManifestUpdateResponsePart: UpdateResponsePart {
  let updateManifest: Update

  required init(updateManifest: Update) {
    self.updateManifest = updateManifest
  }
}

internal final class UpdateResponse {
  let responseHeaderData: ResponseHeaderData?
  let manifestUpdateResponsePart: ManifestUpdateResponsePart?
  let directiveUpdateResponsePart: DirectiveUpdateResponsePart?

  required init(
    responseHeaderData: ResponseHeaderData?,
    manifestUpdateResponsePart: ManifestUpdateResponsePart?,
    directiveUpdateResponsePart: DirectiveUpdateResponsePart?
  ) {
    self.responseHeaderData = responseHeaderData
    self.manifestUpdateResponsePart = manifestUpdateResponsePart
    self.directiveUpdateResponsePart = directiveUpdateResponsePart
  }
}
