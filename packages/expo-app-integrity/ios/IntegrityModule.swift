import ExpoModulesCore
import DeviceCheck
import CryptoKit

public class IntegrityModule: Module {
  private let service = DCAppAttestService.shared

  public func definition() -> ModuleDefinition {
    Name("ExpoAppIntegrity")

    AsyncFunction("generateKey") {
       do {
         return try await service.generateKey()
       } catch let error {
         throw handleIntegrityCheckError(error)
       }
    }

    AsyncFunction("attestKey") { (key: String, challenge: String) in
      let data = Data(challenge.utf8)
      let clientDataHash = Data(SHA256.hash(data: data))

      do {
        let result = try await service.attestKey(key, clientDataHash: clientDataHash)
        guard let attestation = String(data: result, encoding: .utf8) else {
          throw IntegrityException("Failed to decode attestation result from data", code: "ERR_APP_INTEGRITY_DECODE_FAILED")
        }
        return attestation
      } catch let error {
        throw handleIntegrityCheckError(error)
      }
    }

    AsyncFunction("generateAssertion") { (key: String, challenge: String) -> String in
      let data = Data(challenge.utf8)
      let clientDataHash = Data(SHA256.hash(data: data))
      do {
        let result = try await service.generateAssertion(key, clientDataHash: clientDataHash)
        guard let assertion = String(data: result, encoding: .utf8) else {
          throw IntegrityException("Failed to decode assertion result from data", code: "ERR_APP_INTEGRITY_DECODE_FAILED")
        }
        return assertion
      } catch let error {
        throw handleIntegrityCheckError(error)
      }
    }
  }

  // https://developer.apple.com/documentation/devicecheck/dcerror-swift.struct
  private func handleIntegrityCheckError(_ error: Error) -> Exception {
    if let error = error as? DCError {
      switch error.code {
      case .featureUnsupported:
        return IntegrityException("This feature is not supported on this device", code: "ERR_APP_INTEGRITY_FEATURE_UNSUPPORTED")
      case .invalidInput:
        return IntegrityException("Invalid input provided", code: "ERR_APP_INTEGRITY_INVALID_INPUT")
      case .invalidKey:
        return IntegrityException("Invalid key provided", code: "ERR_APP_INTEGRITY_INVALID_KEY")
      case .serverUnavailable:
        return IntegrityException("Server unavailable", code: "ERR_APP_INTEGRITY_SERVER_UNAVAILABLE")
      case .unknownSystemFailure:
        return IntegrityException("Unknown system failure", code: "ERR_APP_INTEGRITY_SYSTEM_FAILURE")
      @unknown default:
        return IntegrityException("Unknown error", code: "ERR_APP_INTEGRITY_UNKNOWN")
      }
    }

    return IntegrityException("Unknown error", code: "ERR_APP_INTEGRITY_UNKNOWN")
  }
}
