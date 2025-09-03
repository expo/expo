import Photos
import ExpoModulesCore

class AssetFieldPredicateBuilder {
  static func buildPredicate(assetField: AssetField, value: Int, symbol: String) -> NSPredicate {
    if assetField == .CREATION_TIME || assetField == .MODIFICATION_TIME {
      let date = Date(timeIntervalSince1970: TimeInterval(value))
      return NSPredicate(format: "\(assetField.photosKey()) \(symbol) %@", argumentArray: [date])
    }
    return NSPredicate(format: "\(assetField.photosKey()) \(symbol) %@", argumentArray: [value])
  }

  static func buildPredicate(assetField: AssetField, value: MediaTypeNext, symbol: String) -> NSPredicate {
    let nsValue = value.toPHAssetMediaType().rawValue
    return NSPredicate(format: "\(assetField.photosKey()) \(symbol) %@", argumentArray: [nsValue])
  }

  static func buildPredicate(assetField: AssetField, values: [Int], symbol: String) -> NSPredicate {
    if assetField == .CREATION_TIME || assetField == .MODIFICATION_TIME {
      let dates = values.map { Date(timeIntervalSince1970: TimeInterval($0)) }
      return NSPredicate(format: "\(assetField.photosKey()) \(symbol) %@", argumentArray: [dates])
    }
    return NSPredicate(format: "\(assetField.photosKey()) \(symbol) %@", argumentArray: [values])
  }

  static func buildPredicate(assetField: AssetField, values: [MediaTypeNext], symbol: String) -> NSPredicate {
    let nsValues = values.map { $0.toPHAssetMediaType().rawValue }
    return NSPredicate(format: "\(assetField.photosKey()) \(symbol) %@", argumentArray: [nsValues])
  }

  static func buildPredicate(assetField: AssetField, value: Either<MediaTypeNext, Int>, symbol: String) throws -> NSPredicate {
    if let intVal = try? value.as(Int.self) {
      return buildPredicate(assetField: assetField, value: intVal, symbol: symbol)
    }
    if let mediaVal = try? value.as(MediaTypeNext.self) {
      return buildPredicate(assetField: assetField, value: mediaVal, symbol: symbol)
    }
    throw PredicateBuilderException("Unsupported Either type for \(assetField)")
  }

  static func buildPredicate(assetField: AssetField, values: Either<[MediaTypeNext], [Int]>, symbol: String) throws -> NSPredicate {
    if let intValues = try? values.as([Int].self) {
      return buildPredicate(assetField: assetField, values: intValues, symbol: symbol)
    }
    if let mediaValues = try? values.as([MediaTypeNext].self) {
      return buildPredicate(assetField: assetField, values: mediaValues, symbol: symbol)
    }
    throw PredicateBuilderException("Unsupported Either type for \(assetField)")
  }
}
