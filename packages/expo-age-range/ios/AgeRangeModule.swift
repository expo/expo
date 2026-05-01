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
  }
}
