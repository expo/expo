import Photos
import Testing

@testable import ExpoMediaLibrary

/// `Query` turns JS filter calls into `NSPredicate`s that PhotoKit evaluates against `PHAsset`.
/// The predicates are asserted by evaluating them against a dictionary rather than by comparing
/// `predicateFormat` strings, so these tests describe behaviour instead of formatting.
@Suite("AssetFieldPredicateBuilder")
struct PredicateBuilderTests {
  /// 2026-01-01T00:00:00Z
  static let timestampMillis = 1_767_225_600_000
  static let date = Date(timeIntervalSince1970: 1_767_225_600)

  @Suite("scalar values")
  struct ScalarTests {
    @Test
    func `compares creation time against a millisecond timestamp`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .CREATION_TIME,
        value: PredicateBuilderTests.timestampMillis,
        symbol: "="
      )

      #expect(predicate.evaluate(with: ["creationDate": PredicateBuilderTests.date]))
    }

    @Test
    func `compares modification time against a millisecond timestamp`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .MODIFICATION_TIME,
        value: PredicateBuilderTests.timestampMillis,
        symbol: "="
      )

      #expect(predicate.evaluate(with: ["modificationDate": PredicateBuilderTests.date]))
    }

    @Test
    func `orders creation time comparisons`() {
      let oneSecondEarlier = PredicateBuilderTests.timestampMillis - 1000
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .CREATION_TIME,
        value: oneSecondEarlier,
        symbol: ">"
      )

      #expect(predicate.evaluate(with: ["creationDate": PredicateBuilderTests.date]))
      #expect(!predicate.evaluate(with: ["creationDate": Date(milliseconds: oneSecondEarlier - 1)]))
    }

    @Test
    func `compares non-date fields as plain numbers`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .WIDTH,
        value: 1080,
        symbol: "<="
      )

      #expect(predicate.evaluate(with: ["pixelWidth": 1080]))
      #expect(!predicate.evaluate(with: ["pixelWidth": 1081]))
    }

    @Test
    func `compares media types by their PHAsset raw value`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .MEDIA_TYPE,
        value: MediaTypeNext.IMAGE,
        symbol: "="
      )

      #expect(predicate.evaluate(with: ["mediaType": PHAssetMediaType.image.rawValue]))
      #expect(!predicate.evaluate(with: ["mediaType": PHAssetMediaType.video.rawValue]))
    }

    @Test
    func `compares booleans`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .IS_FAVORITE,
        value: true,
        symbol: "="
      )

      #expect(predicate.evaluate(with: ["isFavorite": true]))
      #expect(!predicate.evaluate(with: ["isFavorite": false]))
    }
  }

  @Suite("array values")
  struct ArrayTests {
    @Test
    func `matches any of several media types`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .MEDIA_TYPE,
        values: [MediaTypeNext.IMAGE, .VIDEO],
        symbol: "IN"
      )

      #expect(predicate.evaluate(with: ["mediaType": PHAssetMediaType.image.rawValue]))
      #expect(predicate.evaluate(with: ["mediaType": PHAssetMediaType.video.rawValue]))
      #expect(!predicate.evaluate(with: ["mediaType": PHAssetMediaType.audio.rawValue]))
    }

    @Test
    func `matches any of several numbers`() {
      let predicate = AssetFieldPredicateBuilder.buildPredicate(
        assetField: .WIDTH,
        values: [720, 1080],
        symbol: "IN"
      )

      #expect(predicate.evaluate(with: ["pixelWidth": 1080]))
      #expect(!predicate.evaluate(with: ["pixelWidth": 480]))
    }
  }
}
