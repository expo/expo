import AuthenticationServices
import ExpoModulesCore

let credentialRevokedEventName = "Expo.appleIdCredentialRevoked"

struct FullName: Record {
  @Field
  var namePrefix: String?
  @Field
  var nameSuffix: String?
  @Field
  var givenName: String?
  @Field
  var middleName: String?
  @Field
  var familyName: String?
  @Field
  var nickname: String?
}

public final class AppleAuthenticationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppleAuthentication")

    Events(credentialRevokedEventName)

    AsyncFunction("isAvailableAsync") {
      return true
    }

    AsyncFunction("requestAsync") { (options: AppleAuthenticationRequestOptions, promise: Promise) in
      AppleAuthenticationRequest(options: options).performRequest { response, error in
        if let error {
          promise.reject(error)
        } else {
          promise.resolve(response)
        }
      }
    }

    AsyncFunction("getCredentialStateAsync") { (userId: String, promise: Promise) in
      let appleIdProvider = ASAuthorizationAppleIDProvider()

      appleIdProvider.getCredentialState(forUserID: userId) { credentialState, _ in
        // We can ignore the error as the credential state cannot be nil
        // and the error may occur only when the credential state is `notFound`
        promise.resolve(credentialStateToInt(credentialState))
      }
    }

    Function("formatFullName") { (fullName: FullName, formatStyle: FullNameFormatStyle?) in
      let formatStyle = formatStyle?.toFullNameFormatStyle() ?? .default
      var nameComponents = PersonNameComponents()

      nameComponents.namePrefix = fullName.namePrefix
      nameComponents.nameSuffix = fullName.nameSuffix
      nameComponents.givenName = fullName.givenName
      nameComponents.middleName = fullName.middleName
      nameComponents.familyName = fullName.familyName
      nameComponents.nickname = fullName.nickname

      let formatter = PersonNameComponentsFormatter()
      formatter.style = formatStyle

      return formatter.string(from: nameComponents)
    }

    View(AppleAuthenticationButton.self) {
      Events("onButtonPress")

      Prop("buttonType") { (view, type: ButtonType?) in
        let type = type ?? .signIn

        if view.type != type {
          view.type = type
          view.needsUpdate = true
        }
      }

      Prop("buttonStyle") { (view, style: ButtonStyle?) in
        let style = style ?? .white

        if view.style != style {
          view.style = style
          view.needsUpdate = true
        }
      }

      Prop("cornerRadius") { (view, cornerRadius: Double) in
        view.cornerRadius = cornerRadius
      }

      OnViewDidUpdateProps { view in
        view.updateChildIfNeeded()
      }
    }

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(didRevokeCredential(_:)),
        name: ASAuthorizationAppleIDProvider.credentialRevokedNotification,
        object: nil
      )
    }

    OnStopObserving {
      NotificationCenter.default.removeObserver(
        self,
        name: ASAuthorizationAppleIDProvider.credentialRevokedNotification,
        object: nil
      )
    }
  }

  @objc
  func didRevokeCredential(_ notification: Notification) {
    sendEvent(credentialRevokedEventName)
  }
}
