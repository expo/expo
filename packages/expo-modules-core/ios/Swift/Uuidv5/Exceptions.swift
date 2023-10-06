import Foundation

internal class InvalidNamespaceException: GenericException<String> {
  override var reason: String {
    "Namespace: `\(param)` is not a valid namespace. Namespace should be a valid UUID string"
  }
}
