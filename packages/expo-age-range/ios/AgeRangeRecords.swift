import ExpoModulesCore
import DeclaredAgeRange

internal enum AgeRangeDeclaration: String, Enumerable {
  case selfDeclared
  case guardianDeclared

  @available(iOS 26.0, *)
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
    // limited response used by iOS < 26, simulating an adult
    self.lowerBound = 18
  }

  @available(iOS 26.0, *)
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

