import Testing
import Photos

@testable import ExpoMediaLibrary

@Suite("AssetFieldPredicateBuilder")
struct AssetFieldPredicateBuilderTests {
  @Test(arguments: MediaSubtypeNext.allCases)
  func `contains checks that the photos key has the subtype flag`(subtype: MediaSubtypeNext) throws {
    let predicate = AssetFieldPredicateBuilder.buildPredicate(assetField: .MEDIA_SUBTYPES, contains: subtype)

    let comparison = try #require(predicate as? NSComparisonPredicate)
    #expect(comparison.leftExpression.function == "bitwiseAnd:with:")
    #expect(comparison.leftExpression.arguments?.first?.keyPath == "mediaSubtypes")
    #expect(comparison.leftExpression.arguments?.last?.constantValue as? NSObject == NSNumber(value: subtype.toPHAssetMediaSubtype().rawValue))
    #expect(comparison.predicateOperatorType == .notEqualTo)
    #expect(comparison.rightExpression.constantValue as? NSObject == NSNumber(value: 0))
  }
}
