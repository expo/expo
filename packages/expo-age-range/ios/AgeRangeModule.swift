import ExpoModulesCore
import DeclaredAgeRange

public class AgeRangeModule: Module {

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

    AsyncFunction("showSignificantUpdateAcknowledgementAsync") { (updateDescription: String) in
      guard #available(iOS 26.4, *) else {
        return
      }

      let windowScene: UIWindowScene? = await MainActor.run {
        UIApplication.shared.connectedScenes
          .first(where: { $0.activationState == .foregroundActive }) as? UIWindowScene
      }

      guard let windowScene else {
        throw AgeRangeNoViewControllerException()
      }

      do {
        try await AgeRangeService.shared.showSignificantUpdateAcknowledgment(in: windowScene, updateDescription: updateDescription)
      } catch AgeRangeService.Error.notAvailable {
        throw AgeRangeNotAvailableException()
      } catch AgeRangeService.Error.invalidRequest {
        throw AgeRangeInvalidRequestException()
      }
    }
  }
}
