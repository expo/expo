// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum EXDevelopmentClientOrientation: String, Decodable {
  case defaulted = "default" // "default" cannot be used as an identifiere
  case portrait = "portrait"
  case landscape = "landscape"
}

@propertyWrapper
public class CanHavePlatformSpecificValue<T> : Decodable where T : Decodable {
  public var wrappedValue: T
  
  /**
   This constructor shouldn't be called. However, we need that to implement the `Decodable` protocol.
   */
  required public init(from decoder: Decoder) throws {
    throw NSError()
  }
  
  public init(_ value: T) {
    wrappedValue = value
  }
}

@objc
public class iOSSection: NSObject, Decodable {}

@objc
public class EXDevelopmentClientManifest: NSObject, Decodable {
  @objc
  public var name: String
  
  @objc
  public var slug: String
  
  @objc
  public var version: String
  
  @objc
  public var bundleUrl: String
  
  @CanHavePlatformSpecificValue
  public var _backgroundColor: String?
  
  @objc
  public var backgroundColor: UIColor? {
    return EXDevelopmentClientManifestHelper.hexStringToColor(_backgroundColor)
  }
  
  @CanHavePlatformSpecificValue
  var _orientation: EXDevelopmentClientOrientation?

  @objc
  public var orientation: UIInterfaceOrientation {
    return EXDevelopmentClientManifestHelper.exportManifestOrientation(_orientation)
  }
  
  var ios: iOSSection?
  
  public enum CodingKeys: String, CodingKey {
    case name, slug, version, ios, bundleUrl
    case _backgroundColor = "backgroundColor"
    case _orientation = "orientation"
  }

  @objc
  public static func fromJsonData(_ jsonData: Data) -> EXDevelopmentClientManifest? {
    let decoder = JSONDecoder()
    do {
        return try decoder.decode(EXDevelopmentClientManifest.self, from: jsonData)
    } catch {
      return nil
    }
  }
}

public extension KeyedDecodingContainer where Key == EXDevelopmentClientManifest.CodingKeys  {
  func decode<T : Decodable>(_ type: CanHavePlatformSpecificValue<T>.Type, forKey key: Key) throws -> CanHavePlatformSpecificValue<T> {
    let scopedValue = decodedFromIOSSection(T.self, forKey: key)
    if scopedValue != nil {
      return CanHavePlatformSpecificValue<T>.init(scopedValue!)
    }
    
    return CanHavePlatformSpecificValue<T>.init(try self.decode(T.self, forKey: key))
  }
  
  func decode<T : Decodable>(_ type: CanHavePlatformSpecificValue<T?>.Type, forKey key: Key) throws -> CanHavePlatformSpecificValue<T?> {
    let scopedValue = decodedFromIOSSection(T.self, forKey: key)
    if scopedValue != nil {
      return CanHavePlatformSpecificValue<T?>.init(scopedValue)
    }
    
    return CanHavePlatformSpecificValue<T?>.init(try self.decodeIfPresent(T.self, forKey: key))
  }
  
  func decodedFromIOSSection<T: Decodable>(_ type: T.Type, forKey key: Key) -> T? {
    let iosSectionDecoder = try? superDecoder(forKey: .ios)
    let iosSectionConteiner = try? iosSectionDecoder?.container(keyedBy: Key.self)
    return try? iosSectionConteiner?.decodeIfPresent(T.self, forKey: key)
  }
}
