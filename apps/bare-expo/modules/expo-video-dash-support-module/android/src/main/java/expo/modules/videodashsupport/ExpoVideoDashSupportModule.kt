package expo.modules.videodashsupport

import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.video.transport.VideoDataSourceRegistry

/**
 * ExoPlayer plays DASH itself, so on Android this module shows the data source
 * provider hook with a custom URI scheme instead.
 */
@OptIn(UnstableApi::class)
class ExpoVideoDashSupportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoVideoDashSupportModule")

    OnCreate {
      VideoDataSourceRegistry.registerProvider(
        CustomSchemeDataSourceProvider { source ->
          appContext.jsLogger?.debug("Using CustomSchemeDataSourceProvider to load ${source.uri}")
        }
      )
    }

    OnDestroy {
      VideoDataSourceRegistry.unregisterProvider(CustomSchemeDataSourceProvider.PROVIDER_ID)
    }
  }
}
