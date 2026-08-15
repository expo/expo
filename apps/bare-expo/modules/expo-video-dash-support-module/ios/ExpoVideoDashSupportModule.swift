import ExpoModulesCore
import ExpoVideo

public final class ExpoVideoDashSupportModule: Module {
  private let providerIdentifier = "bare-expo.segment-base-dash-loader"

  public func definition() -> ModuleDefinition {
    Name("ExpoVideoDashSupportModule")

    OnCreate {
      let provider = SegmentBaseDASHToHLSProvider(
        identifier: providerIdentifier,
        priority: 500
      ) { source in
        let useDashLoader = source.url.path.hasSuffix(".mpd")

        if useDashLoader {
          self.appContext?.jsLogger.debug("Using SegmentBaseDASHToHLSProvider to load \(source.url)")
        }

        return useDashLoader
      }
      VideoAssetTransportRegistry.registerProvider(provider)
    }

    OnDestroy {
      VideoAssetTransportRegistry.unregisterProvider(withId: providerIdentifier)
    }
  }
}
