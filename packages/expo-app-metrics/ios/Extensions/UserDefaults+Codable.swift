import Foundation

extension ConsentGatedDefaults {
  func set<T: Codable>(codable: T, forKey key: String) {
    if let data = try? JSONEncoder().encode(codable) {
      set(data, forKey: key)
    }
  }

  func codable<T: Codable>(forKey key: String, as type: T.Type) -> T? {
    if let data = object(forKey: key) as? Data {
      return try? JSONDecoder().decode(T.self, from: data)
    }
    return nil
  }
}
