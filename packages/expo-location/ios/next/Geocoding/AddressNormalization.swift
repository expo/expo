import Foundation

func normalizeAddressString(_ value: String?) -> String? {
  guard let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
    return nil
  }
  return value
}
