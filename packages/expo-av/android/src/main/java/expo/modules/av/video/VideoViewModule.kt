package expo.modules.av.video

import com.facebook.react.bridge.ReadableMap
import expo.modules.av.ViewUtils
import expo.modules.av.video.scalablevideoview.ScalableType
import expo.modules.core.arguments.MapArguments
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VideoViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoVideoView")

    View(VideoViewWrapper::class) {
      OnViewDestroys<VideoViewWrapper> { view ->
        view.videoViewInstance.onDropViewInstance()
      }

      Events(
        "onStatusUpdate",
        "onLoadStart",
        "onLoad",
        "onError",
        "onReadyForDisplay",
        "onFullscreenUpdate"
      )

      //region Props set directly in <Video> component

      Prop("status") { view: VideoViewWrapper, status: ReadableMap ->
        view.videoViewInstance.setStatus(MapArguments(status.toHashMap()), null)
      }

      Prop("useNativeControls") { view: VideoViewWrapper, useNativeControls: Boolean ->
        view.videoViewInstance.setUseNativeControls(useNativeControls)
      }

      //endregion

      //region Native only props -- set by Video.js

      Prop("source") { view: VideoViewWrapper, source: ReadableMap ->
        view.videoViewInstance.setSource(MapArguments(source.toHashMap()))
      }

      Prop("resizeMode") { view: VideoViewWrapper, resizeModeOrdinalString: String ->
        view.videoViewInstance.setResizeMode(ScalableType.values()[resizeModeOrdinalString.toInt()])
      }

      //endregion
    }

    //region Native module

    Constant("ScaleNone") { ScalableType.LEFT_TOP.ordinal.toString() }
    Constant("ScaleToFill") { ScalableType.FIT_XY.ordinal.toString() }
    Constant("ScaleAspectFit") { ScalableType.FIT_CENTER.ordinal.toString() }
    Constant("ScaleAspectFill") { ScalableType.CENTER_CROP.ordinal.toString() }

    AsyncFunction("setFullscreen") { tag: Int, shouldBeFullscreen: Boolean, promise: Promise ->
      ViewUtils.tryRunWithVideoView(
        appContext.legacyModuleRegistry,
        tag,
        object : ViewUtils.VideoViewCallback {
          override fun runWithVideoView(videoView: VideoView) {
            val listener = object : FullscreenVideoPlayerPresentationChangeProgressListener() {
              override fun onFullscreenPlayerDidDismiss() {
                promise.resolve(videoView.status)
              }

              override fun onFullscreenPlayerDidPresent() {
                promise.resolve(videoView.status)
              }

              override fun onFullscreenPlayerPresentationTriedToInterrupt() {
                promise.reject("E_FULLSCREEN_VIDEO_PLAYER", "This presentation change tries to interrupt an older request. Await the old request and then try again.", null)
              }

              override fun onFullscreenPlayerPresentationInterrupted() {
                promise.reject("E_FULLSCREEN_VIDEO_PLAYER", "This presentation change has been interrupted by a newer change request.", null)
              }

              override fun onFullscreenPlayerPresentationError(errorMessage: String?) {
                val rejectionMessageBuilder = StringBuilder()
                rejectionMessageBuilder.append("This presentation change has been interrupted by an error.")
                if (errorMessage != null) {
                  rejectionMessageBuilder.append(" ")
                  rejectionMessageBuilder.append(errorMessage)
                }
                promise.reject("E_FULLSCREEN_VIDEO_PLAYER", rejectionMessageBuilder.toString(), null)
              }
            }

            if (shouldBeFullscreen) {
              videoView.ensureFullscreenPlayerIsPresented(listener)
            } else {
              videoView.ensureFullscreenPlayerIsDismissed(listener)
            }
          }
        },
        promise
      )
    }

    //endregion
  }
}
