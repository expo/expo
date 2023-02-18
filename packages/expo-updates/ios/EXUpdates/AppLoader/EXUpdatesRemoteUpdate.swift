// Copyright 2015-present 650 Industries. All rights reserved.

@objc public enum EXUpdatesRemoteUpdateError : Int, Error {
  case DirectiveParsingError
  case InvalidDirectiveType
}

@objcMembers
public final class EXUpdatesSigningInfo : NSObject {
  public let easProjectId: String
  public let scopeKey: String
  
  public required init(easProjectId: String, scopeKey: String) {
    self.easProjectId = easProjectId
    self.scopeKey = scopeKey
  }
}

@objcMembers
public class EXUpdatesUpdateDirective : NSObject {
  public let signingInfo: EXUpdatesSigningInfo?
  
  public init(signingInfo: EXUpdatesSigningInfo?) {
    self.signingInfo = signingInfo
  }
  
  public static func fromJSONData(_ jsonData: Data) throws -> EXUpdatesUpdateDirective {
    let jsonRaw = try JSONSerialization.jsonObject(with: jsonData)
    guard let json = jsonRaw as? [String: Any] else {
      throw EXUpdatesRemoteUpdateError.DirectiveParsingError
    }
    
    let extraDict: [String: Any]? = json.optionalValue(forKey: "extra")
    let signingInfoDict: [String: Any]? = extraDict?.optionalValue(forKey: "signingInfo")
    let signingInfo = signingInfoDict.let { it in
      EXUpdatesSigningInfo(easProjectId: it.requiredValue(forKey: "projectId"), scopeKey: it.requiredValue(forKey: "scopeKey"))
    }
    
    let messageType: String = json.requiredValue(forKey: "type")
    
    switch messageType {
    case "noUpdateAvailable":
      return EXUpdatesNoUpdateAvailableUpdateDirective(signingInfo: signingInfo)
    case "rollBackToEmbedded":
      let parametersDict: [String: Any] = json.requiredValue(forKey: "parameters")
      let commitTimeString: String = parametersDict.requiredValue(forKey: "commitTime")
      guard let commitTime = RCTConvert.nsDate(commitTimeString) else {
        throw EXUpdatesRemoteUpdateError.DirectiveParsingError
      }
      return EXUpdatesRollBackToEmbeddedUpdateDirective(commitTime: commitTime, signingInfo: signingInfo)
    default:
      throw EXUpdatesRemoteUpdateError.InvalidDirectiveType
    }
  }
}

@objcMembers
public final class EXUpdatesNoUpdateAvailableUpdateDirective : EXUpdatesUpdateDirective {}

@objcMembers
public final class EXUpdatesRollBackToEmbeddedUpdateDirective : EXUpdatesUpdateDirective {
  public let commitTime: Date
  
  public required init(commitTime: Date, signingInfo: EXUpdatesSigningInfo?) {
    self.commitTime = commitTime
    super.init(signingInfo: signingInfo)
  }
}

@objcMembers
public class EXUpdatesUpdateResponsePart : NSObject {}

@objcMembers
public final class EXUpdatesDirectiveUpdateResponsePart : EXUpdatesUpdateResponsePart {
  public let updateDirective: EXUpdatesUpdateDirective
  
  public required init(updateDirective: EXUpdatesUpdateDirective) {
    self.updateDirective = updateDirective
  }
}

@objcMembers
public final class EXUpdatesManifestUpdateResponsePart : EXUpdatesUpdateResponsePart {
  public let updateManifest: EXUpdatesUpdate
  
  public required init(updateManifest: EXUpdatesUpdate) {
    self.updateManifest = updateManifest
  }
}

@objcMembers
public final class EXUpdatesUpdateResponse : NSObject {
  public let responseHeaderData: EXUpdatesResponseHeaderData?
  public let manifestUpdateResponsePart: EXUpdatesManifestUpdateResponsePart?
  public let directiveUpdateResponsePart: EXUpdatesDirectiveUpdateResponsePart?
  
  public required init(responseHeaderData: EXUpdatesResponseHeaderData?,
                       manifestUpdateResponsePart: EXUpdatesManifestUpdateResponsePart?,
                       directiveUpdateResponsePart: EXUpdatesDirectiveUpdateResponsePart?) {
    self.responseHeaderData = responseHeaderData
    self.manifestUpdateResponsePart = manifestUpdateResponsePart
    self.directiveUpdateResponsePart = directiveUpdateResponsePart
  }
}
