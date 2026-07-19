import ExpoModulesCore
import LocalAuthentication

public class LocalAuthenticationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoLocalAuthentication")

    AsyncFunction("hasHardwareAsync") { () -> Bool in
      let context = LAContext()
      var error: NSError?
      let isSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: &error)
      let isAvailable: Bool = isSupported || error?.code != LAError.biometryNotAvailable.rawValue

      return isAvailable
    }

    AsyncFunction("isEnrolledAsync") { () -> Bool in
      let context = LAContext()
      var error: NSError?
      let isSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: &error)
      let isEnrolled: Bool = (isSupported && error == nil) || error?.code == LAError.biometryLockout.rawValue

      return isEnrolled
    }

    AsyncFunction("supportedAuthenticationTypesAsync") { () -> [Int] in
      var supportedAuthenticationTypes: [Int] = []

      if isTouchIdDevice() {
        supportedAuthenticationTypes.append(AuthenticationType.fingerprint.rawValue)
      }

      if isFaceIdDevice() {
        supportedAuthenticationTypes.append(AuthenticationType.facialRecognition.rawValue)
      }

      return supportedAuthenticationTypes
    }

    AsyncFunction("getEnrolledLevelAsync") { () -> Int in
      let context = LAContext()
      var error: NSError?

      var level: Int = SecurityLevel.none.rawValue

      let isAuthenticationSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthentication, error: &error)
      if isAuthenticationSupported && error == nil {
        level = SecurityLevel.secret.rawValue
      }

      let isBiometricsSupported: Bool = context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: &error)

      if isBiometricsSupported && error == nil {
        level = SecurityLevel.biometric.rawValue
      }

      return level
    }

    AsyncFunction("authenticateAsync") { (options: LocalAuthenticationOptions, promise: Promise) -> Void in
      var warningMessage: String?
      let reason = options.promptMessage
      let cancelLabel = options.cancelLabel
      let fallbackLabel = options.fallbackLabel
      let disableDeviceFallback = options.disableDeviceFallback

      if isFaceIdDevice() {
        let usageDescription = Bundle.main.object(forInfoDictionaryKey: "NSFaceIDUsageDescription")

        if usageDescription == nil {
          warningMessage = "FaceID is available but has not been configured. To enable FaceID, provide `NSFaceIDUsageDescription`."
        }
      }

      let context = LAContext()

      if fallbackLabel != nil {
        context.localizedFallbackTitle = fallbackLabel
      }

      if cancelLabel != nil {
        context.localizedCancelTitle = cancelLabel
      }

      context.interactionNotAllowed = false

      let policyForAuth = disableDeviceFallback ? LAPolicy.deviceOwnerAuthenticationWithBiometrics : LAPolicy.deviceOwnerAuthentication

      if disableDeviceFallback {
        if warningMessage != nil {
          // If the warning message is set (NSFaceIDUsageDescription is not configured) then we can't use
          // authentication with biometrics — it would crash, so let's just resolve with no success.
          // We could reject, but we already resolve even if there are any errors, so sadly we would need to introduce a breaking change.
          return promise.resolve([
            "success": false,
            "error": "missing_usage_description",
            "warning": warningMessage as Any
          ])
        }
      }

      context.evaluatePolicy(policyForAuth, localizedReason: reason ?? "") { success, error in
        var err: String?

        if let error = error as? NSError {
          err = convertErrorCode(error: error)
        }

        return promise.resolve([
          "success": success,
          "error": err as Any,
          "warning": warningMessage as Any
        ])
      }
    }
  }
}

func isFaceIdDevice() -> Bool {
  let context = LAContext()
  context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: nil)

  return context.biometryType == LABiometryType.faceID
}

func isTouchIdDevice() -> Bool {
  let context = LAContext()
  context.canEvaluatePolicy(LAPolicy.deviceOwnerAuthenticationWithBiometrics, error: nil)

  return context.biometryType == LABiometryType.touchID
}

func convertErrorCode(error: NSError) -> String {
  switch error.code {
  case LAError.systemCancel.rawValue:
    return "system_cancel"
  case LAError.appCancel.rawValue:
    return "app_cancel"
  case LAError.biometryLockout.rawValue:
    return "lockout"
  case LAError.userFallback.rawValue:
    return "user_fallback"
  case LAError.userCancel.rawValue:
    return "user_cancel"
  case LAError.biometryNotAvailable.rawValue:
    return "not_available"
  case LAError.invalidContext.rawValue:
    return "invalid_context"
  case LAError.biometryNotEnrolled.rawValue:
    return "not_enrolled"
  case LAError.passcodeNotSet.rawValue:
    return "passcode_not_set"
  case LAError.authenticationFailed.rawValue:
    return "authentication_failed"
  default:
      return "unknown: \(error.code), \(error.localizedDescription)"
  }
}

enum AuthenticationType: Int {
  case fingerprint = 1
  case facialRecognition = 2
 }

enum SecurityLevel: Int {
  case none = 0
  case secret = 1
  // We return any biometric as strong biometric, because there are currently no iOS devices with weak biometric options.
  case biometric = 3
 }
