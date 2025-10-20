import ExpoModulesCore
import DeclaredAgeRange

@available(iOS 26.0, *)
internal enum AgeRangeDeclaration: String, Enumerable {
  case selfDeclared
  case guardianDeclared

  public init(_ range: AgeRangeService.AgeRangeDeclaration) {
    switch range {
    case .selfDeclared:
      self = .selfDeclared
    case .guardianDeclared:
      self = .guardianDeclared
    @unknown default:
      assertionFailure("Unknown AgeRangeDeclaration: \(range)")
      self = .selfDeclared
    }
  }
}

@available(iOS 26.0, *)
internal struct AgeRangeResponse: Record {
  @Field
  var lowerBound: Int?
  @Field
  var upperBound: Int?
  @Field
  var ageRangeDeclaration: AgeRangeDeclaration?
  @Field
  var activeParentalControls: [String] = []

  public init() {
  }

  public init(_ range: AgeRangeService.AgeRange) {
    self.lowerBound = range.lowerBound
    self.upperBound = range.upperBound
    self.ageRangeDeclaration = range.ageRangeDeclaration.map(AgeRangeDeclaration.init)

    var controls: [String] = []
    if range.activeParentalControls.contains(.communicationLimits) {
      controls.append("communicationLimits")
    }
    self.activeParentalControls = controls
  }
}

internal struct AgeRangeRequestParams: Record {
  @Field
  var threshold1: Int
  @Field
  var threshold2: Int?
  @Field
  var threshold3: Int?
}

