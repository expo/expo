package abi30_0_0.host.exp.exponent.modules.api.av.video;

import android.support.annotation.Nullable;
import android.view.View;

import abi30_0_0.com.facebook.react.bridge.Promise;
import abi30_0_0.com.facebook.react.bridge.ReactApplicationContext;
import abi30_0_0.com.facebook.react.bridge.ReactContextBaseJavaModule;
import abi30_0_0.com.facebook.react.bridge.ReactMethod;
import abi30_0_0.com.facebook.react.uimanager.NativeViewHierarchyManager;
import abi30_0_0.com.facebook.react.uimanager.UIBlock;
import abi30_0_0.com.facebook.react.uimanager.UIManagerModule;

public class VideoManager extends ReactContextBaseJavaModule {
  private final static String NAME = "ExponentVideoManager";
  private final ReactApplicationContext mReactApplicationContext;

  @Override
  public String getName() {
    return NAME;
  }

  public VideoManager(final ReactApplicationContext reactContext) {
    super(reactContext);

    mReactApplicationContext = reactContext;
  }

  // Imperative API

  @ReactMethod
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
    mReactApplicationContext.getNativeModule(UIManagerModule.class).addUIBlock(new UIBlock() {
      @Override
      public void execute(final NativeViewHierarchyManager nativeViewHierarchyManager) {
        final VideoViewWrapper videoViewWrapper;
        try {
          final View view = nativeViewHierarchyManager.resolveView(tag);
          if (!(view instanceof VideoViewWrapper)) {
            throw new Exception();
          }
          videoViewWrapper = (VideoViewWrapper) view;
        } catch (final Throwable e) {
          promise.reject("E_VIDEO_TAGINCORRECT", "Invalid view returned from registry.");
          return;
        }
        callback.runWithVideoView(videoViewWrapper.getVideoViewInstance());
      }
    });
  }
}
