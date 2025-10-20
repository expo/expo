import ExpoModulesCore
import DeclaredAgeRange

public class AgeRangeModule: Module {

  public func definition() -> ModuleDefinition {
    Name("ExpoAgeRange")

    AsyncFunction("requestAgeRangeAsync") { (opts: AgeRangeRequestParams) in
      guard #available(iOS 26.0, *) else {
        throw AgeRangeException("Declared Age Range APIs requires iOS 26+", code: AgeRangeErrorCodes.featureUnsupported)
      }

      let currentVc: UIViewController? = await MainActor.run { [appContext] in
        appContext?.utilities?.currentViewController()
      }

      guard let currentVc else {
        throw AgeRangeException("No current view controller available")
      }

      do {
        let response = try await AgeRangeService.shared.requestAgeRange(ageGates: opts.threshold1, opts.threshold2, opts.threshold3, in: currentVc)
        switch response {
        case .declinedSharing:
          throw AgeRangeException("User declined sharing age range", code: AgeRangeErrorCodes.userDeclined)
        case .sharing(let range):
          return AgeRangeResponse(range)
        @unknown default:
          throw AgeRangeException("Unknown age range response type", code: AgeRangeErrorCodes.unknown)
        }
      } catch AgeRangeService.Error.notAvailable {
        throw AgeRangeException("AgeRangeService not available", code: AgeRangeErrorCodes.notAvailable)
      } catch AgeRangeService.Error.invalidRequest {
        throw AgeRangeException("Invalid age range request", code: AgeRangeErrorCodes.invalidRequest)
      }
    }
  }
}
