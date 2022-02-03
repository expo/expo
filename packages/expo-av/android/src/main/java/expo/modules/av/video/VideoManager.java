package expo.modules.av.video;

import android.content.Context;
import androidx.annotation.Nullable;

import com.yqritc.scalablevideoview.ScalableType;

import java.util.HashMap;
import java.util.Map;

import expo.modules.core.ExportedModule;
import expo.modules.core.ModuleRegistry;
import expo.modules.core.Promise;
import expo.modules.core.interfaces.ExpoMethod;
import expo.modules.core.interfaces.services.UIManager;

public class VideoManager extends ExportedModule {
  private final static String NAME = "ExpoVideoManager";
  private ModuleRegistry mModuleRegistry;

  @Override
  public String getName() {
    return NAME;
  }

  public VideoManager(final Context reactContext) {
    super(reactContext);
  }

  @Override
  public Map<String, Object> getConstants() {
    // We cast the values as Object so that MapBuilder gives a Map<String, Object> instance.
    Map<String, Object> constants = new HashMap<>();
    constants.put("ScaleNone", Integer.toString(ScalableType.LEFT_TOP.ordinal()));
    constants.put("ScaleToFill", Integer.toString(ScalableType.FIT_XY.ordinal()));
    constants.put("ScaleAspectFit", Integer.toString(ScalableType.FIT_CENTER.ordinal()));
    constants.put("ScaleAspectFill", Integer.toString(ScalableType.CENTER_CROP.ordinal()));
    return constants;
  }

  @Override
  public void onCreate(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  // Imperative API

  @ExpoMethod
  public void setFullscreen(final Integer tag, final Boolean shouldBeFullscreen, final Promise promise) {
    tryRunWithVideoView(tag, new VideoViewCallback() {
      @Override
      public void runWithVideoView(final VideoView videoView) {
        FullscreenVideoPlayerPresentationChangeProgressListener listener = new FullscreenVideoPlayerPresentationChangeProgressListener() {
          @Override
          public void onFullscreenPlayerDidDismiss() {
            promise.resolve(videoView.getStatus());
          }

          @Override
          public void onFullscreenPlayerDidPresent() {
            promise.resolve(videoView.getStatus());
          }

          @Override
          public void onFullscreenPlayerPresentationTriedToInterrupt() {
            promise.reject("E_FULLSCREEN_VIDEO_PLAYER", "This presentation change tries to interrupt an older request. Await the old request and then try again.");
          }

          @Override
          public void onFullscreenPlayerPresentationInterrupted() {
            promise.reject("E_FULLSCREEN_VIDEO_PLAYER", "This presentation change has been interrupted by a newer change request.");
          }

          @Override
          void onFullscreenPlayerPresentationError(@Nullable String errorMessage) {
            StringBuilder rejectionMessageBuilder = new StringBuilder();
            rejectionMessageBuilder.append("This presentation change has been interrupted by an error.");
            if (errorMessage != null) {
              rejectionMessageBuilder.append(" ");
              rejectionMessageBuilder.append(errorMessage);
            }
            promise.reject("E_FULLSCREEN_VIDEO_PLAYER", rejectionMessageBuilder.toString());
          }
        };

        if (shouldBeFullscreen) {
          videoView.ensureFullscreenPlayerIsPresented(listener);
        } else {
          videoView.ensureFullscreenPlayerIsDismissed(listener);
        }
      }
    }, promise);
  }

  private interface VideoViewCallback {
    void runWithVideoView(final VideoView videoView);
  }

  // Rejects the promise if the VideoView is not found, otherwise executes the callback.
  private void tryRunWithVideoView(final Integer tag, final VideoViewCallback callback, final Promise promise) {
    mModuleRegistry.getModule(UIManager.class).addUIBlock(tag, new UIManager.UIBlock<VideoViewWrapper>() {
      @Override
      public void resolve(VideoViewWrapper videoViewWrapper) {
        callback.runWithVideoView(videoViewWrapper.getVideoViewInstance());
      }

      @Override
      public void reject(Throwable throwable) {
        promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.");
      }
    }, VideoViewWrapper.class);
  }
}
