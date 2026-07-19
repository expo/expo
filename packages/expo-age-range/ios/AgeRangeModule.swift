import ExpoModulesCore
import DeclaredAgeRange

public class AgeRangeModule: Module, @unchecked Sendable {

  public func definition() -> ModuleDefinition {
    Name("ExpoAgeRange")

    AsyncFunction("requestAgeRangeAsync") { (opts: AgeRangeRequestParams) in
      guard #available(iOS 26.0, *) else {
        return AgeRangeResponse()
      }

      let currentVc: UIViewController? = await MainActor.run { [appContext] in
        appContext?.utilities?.currentViewController()
      }

      guard let currentVc else {
        throw AgeRangeNoViewControllerException()
      }

      do {
        let response = try await AgeRangeService.shared.requestAgeRange(ageGates: opts.threshold1, opts.threshold2, opts.threshold3, in: currentVc)
        switch response {
        case .sharing(let range):
          return AgeRangeResponse(range)
        case .declinedSharing:
          throw AgeRangeUserDeclinedException()
        @unknown default:
          throw AgeRangeUnknownResponseException()
        }
      } catch AgeRangeService.Error.notAvailable {
        throw AgeRangeNotAvailableException()
      } catch AgeRangeService.Error.invalidRequest {
        throw AgeRangeInvalidRequestException()
      }
    }

    AsyncFunction("isEligibleForAgeFeaturesAsync") { () -> Bool? in
      guard #available(iOS 26.2, *) else {
        return nil
      }
      do {
        return try await AgeRangeService.shared.isEligibleForAgeFeatures
      } catch AgeRangeService.Error.notAvailable {
        throw AgeRangeNotAvailableException()
      }
    }

    AsyncFunction("showSignificantUpdateAcknowledgmentAsync") { (updateDescription: String) in
      guard #available(iOS 26.4, *) else {
        return
      }

      let windowScene: UIWindowScene? = await MainActor.run { [appContext] in
        appContext?.utilities?.currentViewController()?.view?.window?.windowScene
      }

      guard let windowScene else {
        throw AgeRangeNoViewControllerException()
      }

      do {
        try await AgeRangeService.shared.showSignificantUpdateAcknowledgment(in: windowScene, updateDescription: updateDescription)
      } catch AgeRangeService.Error.notAvailable {
        throw AgeRangeNotAvailableException()
      }
    }

    AsyncFunction("getRequiredRegulatoryFeaturesAsync") { () -> [String]? in
      guard #available(iOS 26.4, *) else {
        return nil
      }
      do {
        let features = try await AgeRangeService.shared.requiredRegulatoryFeatures
        return features.compactMap { feature -> String? in
          switch feature {
          case .declaredAgeRangeRequired: "declaredAgeRangeRequired"
          case .significantAppChangeRequiresAdultNotification: "significantAppChangeRequiresAdultNotification"
          case .significantAppChangeRequiresParentalConsent: "significantAppChangeRequiresParentalConsent"
          @unknown default: nil
          }
        }
      } catch AgeRangeService.Error.notAvailable {
        throw AgeRangeNotAvailableException()
      }
    }
  }
}
