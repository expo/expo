// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum EXDevLauncherOrientation: String, Decodable {
  case defaulted = "default" // "default" cannot be used as an identifiere
  case portrait = "portrait"
  case landscape = "landscape"
}

enum EXDevLauncherUserInterfaceStyle: String, Decodable {
  case automatic = "automatic"
  case light = "light"
  case dark = "dark"
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
public class DeveloperSection: NSObject, Decodable {
  @objc
  public var tool: String?

  public enum CodingKeys: String, CodingKey {
    case tool
  }
}

@objc
public class EXDevLauncherManifest: NSObject, Decodable {
  @objc
  var _rawData: String? = nil
  
  @objc
  public var rawData: String? {
    return _rawData
  }
  
  @objc
  public var name: String
  
  @objc
  public var slug: String
  
  @objc
  public var version: String
  
  @objc
  public var bundleUrl: String
  
  @CanHavePlatformSpecificValue
  var _userInterfaceStyle: EXDevLauncherUserInterfaceStyle?
  
  @objc
  @available(iOS 12.0, *)
  public var userInterfaceStyle: UIUserInterfaceStyle {
    return EXDevLauncherManifestHelper.exportManifestUserInterfaceStyle(_userInterfaceStyle);
  }
  
  @CanHavePlatformSpecificValue
  var _backgroundColor: String?
  
  @objc
  public var backgroundColor: UIColor? {
    return EXDevLauncherManifestHelper.hexStringToColor(_backgroundColor)
  }
  
  @CanHavePlatformSpecificValue
  var _orientation: EXDevLauncherOrientation?

  @objc
  public var orientation: UIInterfaceOrientation {
    return EXDevLauncherManifestHelper.exportManifestOrientation(_orientation)
  }
  
  @objc
  public var developer: DeveloperSection?

  var ios: iOSSection?
  
  public enum CodingKeys: String, CodingKey {
    case name, slug, version, ios, bundleUrl, developer
    case _backgroundColor = "backgroundColor"
    case _orientation = "orientation"
    case _userInterfaceStyle = "userInterfaceStyle"
  }

  @objc
  public static func fromJsonObject(_ jsonObject: NSDictionary) -> EXDevLauncherManifest? {
    do {
      let data = try JSONSerialization.data(withJSONObject: jsonObject, options: [])
      return fromJsonData(data)
    } catch {
      return nil
    }
  }

  @objc
  public static func fromJsonData(_ jsonData: Data) -> EXDevLauncherManifest? {
    let decoder = JSONDecoder()
    do {
      let rawManifest = String(decoding: jsonData, as: UTF8.self)
      let decodedManifest = try decoder.decode(EXDevLauncherManifest.self, from: jsonData)
      decodedManifest._rawData = rawManifest
      return decodedManifest
    } catch {
      return nil
    }
  }

  @objc
  public func isUsingDeveloperTool() -> Bool {
    return self.developer?.tool != nil;
  }
}

public extension KeyedDecodingContainer where Key == EXDevLauncherManifest.CodingKeys  {
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
