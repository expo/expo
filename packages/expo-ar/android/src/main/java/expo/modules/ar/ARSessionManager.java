// Copyright 2018-present 650 Industries. All rights reserved.

package expo.modules.ar;

import android.content.Context;
import android.os.Bundle;
import android.os.Parcelable;
import android.util.Log;

import com.google.ar.core.Anchor;
import com.google.ar.core.ArCoreApk;
import com.google.ar.core.AugmentedImage;
import com.google.ar.core.Camera;
import com.google.ar.core.Frame;
import com.google.ar.core.HitResult;
import com.google.ar.core.LightEstimate;
import com.google.ar.core.Plane;
import com.google.ar.core.Point;
import com.google.ar.core.PointCloud;
import com.google.ar.core.Pose;
import com.google.ar.core.Session;
import com.google.ar.core.Trackable;
import com.google.ar.core.TrackingState;
import com.google.ar.core.exceptions.CameraNotAvailableException;
import com.google.ar.core.exceptions.UnavailableApkTooOldException;
import com.google.ar.core.exceptions.UnavailableArcoreNotInstalledException;
import com.google.ar.core.exceptions.UnavailableSdkTooOldException;

import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.ActivityProvider;
import expo.core.interfaces.ExpoMethod;
import expo.core.interfaces.services.UIManager;
import expo.modules.ar.gl.ARGLBackgroundRenderer;
import expo.modules.ar.gl.ARGLCameraObject;
import expo.modules.gl.GLCameraObject;
import expo.modules.gl.GLContext;
import expo.modules.gl.GLView;

import static expo.modules.gl.cpp.EXGL.EXGLContextCreateObject;

public class ARSessionManager {
  private static final String E_CAMERA_NOT_AVAILABLE = "E_CAMERA_NOT_AVAILABLE";
  private static final String TAG = ARSessionManager.class.getSimpleName();

  private final ModuleRegistry mModuleRegistry;
//  private final ARGLBackgroundRenderer mARGLBackgroundRenderer;
  private ARGLCameraObject mCamera;

  public ARSessionManagerDelegate delegate;
  private Session mSession;
  private GLView mGLView;
  private boolean isReady = false;

  private boolean installRequested;

  private float[] viewMatrix = new float[16];
  private float[] projectionMatrix = new float[16];
  private float[] poseMatrix = new float[16];

  private TrackingState trackingState = TrackingState.STOPPED;

  private long mPreviousFrameTimestamp = 0;
  private ScheduledExecutorService mExecutorService;
  private Frame storedFrame;

  ARSessionManager(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
//    mARGLBackgroundRenderer = new ARGLBackgroundRenderer(context);
  }

  public void startWithGLView(final GLView view, final Promise promise) {
    mGLView = view;

    try {
      ensureArCoreAvailability(view);
    } catch (IllegalStateException e) {
      promise.reject(TAG, e);
      return;
    }

    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        mCamera = new ARGLCameraObject(mGLView.getGLContext(), mSession);
        resume(promise);
      }
    });

//    resume(promise);
//    mARGLBackgroundRenderer.initialize(mGLView, mSession, new Runnable() {
//      @Override
//      public void run() {
//        resume(promise);
//      }
//    });
  }

  private void ensureArCoreAvailability(GLView view) throws IllegalStateException {
    String errorMessage = null;
    Exception error = null;
    ActivityProvider activityProvider = mModuleRegistry.getModule(ActivityProvider.class);
    if (activityProvider == null) {
      throw new IllegalStateException("Activity not reachable");
    }
    try {
      switch (ArCoreApk.getInstance().requestInstall(activityProvider.getCurrentActivity(), !installRequested)) {
        case INSTALL_REQUESTED:
          installRequested = true;
          throw new IllegalStateException("Not installed");
        case INSTALLED:
          break;
      }

      mSession = new Session(view.getContext());
    } catch (UnavailableApkTooOldException e) {
      errorMessage = "ARCore is out of date";
      error = e;
    } catch (UnavailableArcoreNotInstalledException e) {
      errorMessage = "ARCore is not installed";
      error = e;
    } catch (UnavailableSdkTooOldException e) {
      errorMessage = "App is out of date";
      error = e;
    } catch (Exception e) {
      errorMessage = "AR is not supported on this device.";
      error = e;
    }
    // TODO: ADD MORE ERRORS!

    if (errorMessage != null) {
      throw new IllegalStateException(errorMessage, error);
    }
  }

  private Frame getCurrentFrame() {
    Frame frame = null;
    if (mSession != null) {
      try {
        if (storedFrame == null) {
          frame = mSession.update();
        } else {
          frame = storedFrame;
        }
      } catch (Exception e) {
        //TODO:Bacon: Throw
      }
    }
    return frame;
  }

  public void update() {
    if (mSession == null) {
      return;
    }

    try {
      Frame frame;
      if (storedFrame == null) {
        frame = mSession.update();
      } else {
        frame = storedFrame;
      }
//      if (mPreviousFrameTimestamp == frame.getTimestamp()) {
//        mPreviousFrameTimestamp = frame.getTimestamp();
//        return;
//      }
//      mPreviousFrameTimestamp = frame.getTimestamp();

//      trackingState = frame.getCamera().getTrackingState();

//      if (trackingState != TrackingState.TRACKING) {
//        return;
//      }

//      mARGLBackgroundRenderer.drawFrame(frame);

      if (mCamera != null)
      mCamera.drawFrame(frame);
      isReady = true;

      // Cache values
//      pose = frame.getCamera().getPose();
//      frame.getCamera().getViewMatrix(viewMatrix, 0);

//      // Send data
//      Bundle frameData = serializeFrame(frame);
//      promise.resolve(frameData);

//      return output;
    } catch (Throwable e) {
      Log.w("FRAME", e);
//      promise.reject(TAG, "Unsupported Operation", e);
//      e.printStackTrace();
//    } catch (MissingGlContextException e) {
//      promise.reject(TAG, "Missing GL Context", e);
//      e.printStackTrace();
//    } catch (Throwable e) {
//      promise.reject(TAG, e);
//      e.printStackTrace();
    }
  }

  protected void pause() {
    if (mSession == null) return;
    storedFrame = null;
    mSession.pause();
    stopUpdatingFrames();
  }

  private void stopUpdatingFrames() {
    mExecutorService.shutdown();
    mExecutorService = null;
  }

  protected void resume(Promise promise) {
    if (mSession == null) {
      promise.reject("E_NULL_SESSION", "The AR Session has not been created.");
      return;
    }

    try {
      mSession.resume();
      startUpdatingFrames();
      promise.resolve(new Bundle());
    } catch (CameraNotAvailableException e) {
      promise.reject(E_CAMERA_NOT_AVAILABLE, "Ensure camera permission is granted.", e);
    }
  }

  private void startUpdatingFrames() {
    mExecutorService = Executors.newSingleThreadScheduledExecutor();
    mExecutorService.scheduleWithFixedDelay(new Runnable() {
      @Override
      public void run() {
        mGLView.runOnGLThread(new Runnable() {
          @Override
          public void run() {
            update();
          }
        });
      }
    }, 66, 66, TimeUnit.MILLISECONDS);
  }

  protected void stop() {
    if (mSession != null) {
      mSession.setCameraTextureName(-1);
      mSession = null;
//      mARGLBackgroundRenderer.stop();
      if (mCamera != null)
        mCamera.destroy();
    }
  }

  public boolean isInitialized() {
    return isReady;
  }

  public boolean isTracking() {
    return trackingState == TrackingState.TRACKING;
  }

  public void getProjectionMatrix(final float near, final float far, final Promise promise) {
    final Bundle map = new Bundle();

    if (isReady) {
      mGLView.runOnGLThread(new Runnable() {
        @Override
        public void run() {
          try {

            Camera camera = mSession.update().getCamera();
            camera.getProjectionMatrix(projectionMatrix, 0, near, far);
            camera.getViewMatrix(viewMatrix, 0);
            map.putFloatArray("viewMatrix", viewMatrix);
            map.putFloatArray("projectionMatrix", projectionMatrix);
            promise.resolve(map);
          } catch (CameraNotAvailableException e) {
            promise.reject(E_CAMERA_NOT_AVAILABLE, e.getLocalizedMessage());
          }
        }});
    } else {
//      promise.reject(E_CAMERA_NOT_AVAILABLE, "Session not ready yet");
      map.putFloatArray("viewMatrix", viewMatrix);
      map.putFloatArray("projectionMatrix", projectionMatrix);
      promise.resolve(map);
    }
  }

  protected void getCurrentFrameAsync(final Map<String, Object> attributes, final Promise promise) {
    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        Frame currentFrame = getCurrentFrame();
        if (currentFrame != null) {
          Bundle frame = serializeFrame(currentFrame, attributes);
          promise.resolve(frame);
        } else {
          promise.resolve(null);
        }

      }
    });

  }

  private Bundle serializeFrame(Frame frame, Map<String, Object> attributes) {
    Bundle output = new Bundle();
//    Pose pose = frame.getAndroidSensorPose();
//    pose.toMatrix(poseMatrix, 0);
    output.putDouble("timestamp", frame.getTimestamp());

    if (attributes.containsKey("anchors")) {
      Object anchorProps = attributes.get("anchors");
      Boolean prevent = (anchorProps instanceof Boolean) && !((Boolean) anchorProps);
      if (!prevent) {
        Bundle anchorOutput = new Bundle();
        Collection<Anchor> anchors = frame.getUpdatedAnchors();

        if (anchors.size() > 0)
          anchorOutput.putParcelableArrayList("anchors", serializeAnchors(anchors));
        Collection<Plane> planes = frame.getUpdatedTrackables(Plane.class);
        if (planes.size() > 0)
          anchorOutput.putParcelableArrayList("planes", serializeTrackables(planes));
        Collection<AugmentedImage> images = frame.getUpdatedTrackables(AugmentedImage.class);
        if (images.size() > 0)
          anchorOutput.putParcelableArrayList("images", serializeTrackables(images));
        Collection<Point> points = frame.getUpdatedTrackables(Point.class);
        if (points.size() > 0)
          anchorOutput.putParcelableArrayList("points", serializeTrackables(points));

        output.putBundle("anchors", anchorOutput);
      }
    }

    if (attributes.containsKey("rawFeaturePoints") && attributes.get("rawFeaturePoints") instanceof Boolean) {
      Boolean shouldReturn = (Boolean) attributes.get("rawFeaturePoints");
      if (shouldReturn) {
        PointCloud pointCloud = frame.acquirePointCloud();
        output.putBundle("rawFeaturePoints", serializePointCloud(pointCloud));
        pointCloud.release();
      }
    }

    if (attributes.containsKey("lightEstimation") && attributes.get("lightEstimation") instanceof Boolean) {
      Boolean shouldReturn = (Boolean) attributes.get("lightEstimation");
      if (shouldReturn) {
        LightEstimate lightEstimate = frame.getLightEstimate();
        output.putBundle("lightEstimation", serializeLightEstimation(lightEstimate));
      }
    }

    //TODO: Evan: Throwing UnsupportedOperationException
//      output.putMap("pointCloud", serializePointCloud(pointCloud));
//      output.putArray("anchors", serializeAnchors(anchors));
    return output;
  }

  private String serializeLightEstimationState(LightEstimate.State state) {
    switch (state) {
      case VALID:
        return "valid";
      default:
        return "invalid";
    }
  }

  private Bundle serializeLightEstimation(LightEstimate lightEstimate) {
    float[] matrix = new float[16];
    lightEstimate.getColorCorrection(matrix, 0);

    Bundle result = new Bundle();
    result.putString("state", serializeLightEstimationState(lightEstimate.getState()));
    result.putDouble("intensity", lightEstimate.getPixelIntensity());
    result.putFloatArray("color", matrix);
    return result;
  }

  private String serializeCloudAnchorState(Anchor.CloudAnchorState state) {
    switch (state) {
      case TASK_IN_PROGRESS:
        return "taskInProgress";
      case SUCCESS:
        return "success";
      case ERROR_INTERNAL:
        return "errorInternal";
      case ERROR_NOT_AUTHORIZED:
        return "errorNotAuthorized";
      case ERROR_SERVICE_UNAVAILABLE:
        return "errorServiceUnavailable";
      case ERROR_RESOURCE_EXHAUSTED:
        return "errorResourceExhausted";
      case ERROR_HOSTING_DATASET_PROCESSING_FAILED:
        return "errorHostingDatasetProcessingFailed";
      case ERROR_CLOUD_ID_NOT_FOUND:
        return "errorCloudIdNotFound";
      case ERROR_RESOLVING_LOCALIZATION_NO_MATCH:
        return "errorResolvingLocalizationNoMatch";
      case ERROR_RESOLVING_SDK_VERSION_TOO_OLD:
        return "errorResolvingSdkVersionTooOld";
      case ERROR_RESOLVING_SDK_VERSION_TOO_NEW:
        return "errorResolvingSdkVersionTooNew";
      default:
        return "none";
    }
  }

  //TODO:Bacon: Add types for ARKit parity
  public void performHitTestAsync(final float x, final float y, String types, final Promise promise) {

    mGLView.runOnGLThread(new Runnable() {
      @Override
      public void run() {
        List output = new ArrayList();
        Frame frame = getCurrentFrame();
        if (frame != null) {

         output = serializeHitResults(frame.hitTest(x, y));
        }
        promise.resolve(output);
      }
      });
  }

  private ArrayList<? extends Parcelable> serializeTrackables(Collection<? extends Trackable> trackables) {
    ArrayList<Bundle> output = new ArrayList<>();
    for (Trackable trackable : trackables) {
      output.add(serializeTrackable(trackable));
    }
    return output;
  }

  private Bundle serializeTrackable(Trackable trackable) {
    Bundle output = new Bundle();
    output.putInt("id", trackable.hashCode());
    output.putString("state", serializeTrackingState(trackable.getTrackingState()));

    if (trackable instanceof Plane) {
      return serializePlane((Plane)trackable, output);
    } else if (trackable instanceof AugmentedImage) {
      return serializeImage((AugmentedImage) trackable, output);
    } else if (trackable instanceof Point) {
      return serializePoint((Point) trackable, output);
    }
    output.putString("type", "trackable");
    return output;
  }

  private Bundle serializeHitResult(HitResult hitResult) {
    Bundle output = new Bundle();
    output.putInt("id", hitResult.hashCode());
    output.putBundle("anchor", serializeTrackable(hitResult.getTrackable()));
    output.putFloat("distance", hitResult.getDistance());
    output.putFloatArray("transform", serializePose(hitResult.getHitPose()));
    return output;
  }

  private List serializeHitResults(List<HitResult> hitResults) {
    List<Bundle> output = new ArrayList<>();
    for (HitResult hitResult : hitResults) {
      output.add(serializeHitResult(hitResult));
    }
    return output;
  }

  private String serializeTrackingState(TrackingState trackingState) {
    switch (trackingState) {
      case PAUSED:
        return "paused";
      case TRACKING:
        return "tracking";
      case STOPPED:
        return "stopped";
      default:
        return "none";
    }
  }

  private ArrayList<Bundle> serializeAnchors(Collection<Anchor> anchors) {
    ArrayList<Bundle> output = new ArrayList<>();
    for (Anchor anchor : anchors) {
      output.add(serializeAnchor(anchor, new Bundle()));
    }
    if (output.size() > 0)
      return output;
    return null;
  }

  private Bundle serializeAnchor(Anchor anchor, Bundle output) {
    Anchor.CloudAnchorState state = anchor.getCloudAnchorState();
    TrackingState trackingState = anchor.getTrackingState();

    Pose pose = anchor.getPose();

    output.putInt("id", anchor.hashCode());
    output.putString("type", "anchor");
    output.putFloatArray("transform", serializePose(pose)); //TODO:Bacon: Prolly not right
    output.putString("cloudId", anchor.getCloudAnchorId());
    output.putString("cloudState", serializeCloudAnchorState(state));
    output.putString("state", serializeTrackingState(trackingState));
    return output;
  }

  private String serializeOrientationMode(Point.OrientationMode orientation) {
    switch (orientation) {
      case ESTIMATED_SURFACE_NORMAL:
        return "estimatedSurfaceNormal";
      case INITIALIZED_TO_IDENTITY:
        return "initializedToIdentity";
      default:
        return null;
    }
  }

  private Bundle serializePoint(Point point, Bundle output) {
    output.putString("type", "point");
    output.putString("mode", serializeOrientationMode(point.getOrientationMode()));
    ArrayList anchors = serializeAnchors(point.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);
    return output;
  }

  private Bundle serializeImage(AugmentedImage image, Bundle output) {
    output.putString("type", "image");
    output.putFloatArray("transform", serializePose(image.getCenterPose()));
    Bundle extent = new Bundle();
    extent.putFloat("x", image.getExtentX());
    extent.putFloat("z", image.getExtentZ());
    output.putBundle("extent", extent);
    output.putInt("index", image.getIndex());
    output.putString("name", image.getName());
    ArrayList anchors = serializeAnchors(image.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);
    return output;
  }

  private float[] serializePose(Pose pose) {
    float[] matrix = new float[16];
    pose.toMatrix(matrix, 0);
    return matrix;
  }

  private String serializePlaneType(Plane.Type type) {
    switch (type) {
      case VERTICAL:
        return "vertical";
      case HORIZONTAL_UPWARD_FACING:
        return "horizontalUpward";
      case HORIZONTAL_DOWNWARD_FACING:
        return "horizontalDownward";
      default:
        return null;
    }
  }

  private Bundle serializePlane(Plane plane, Bundle output) {
    output.putFloatArray("transform", serializePose(plane.getCenterPose()));

    Bundle extent = new Bundle();
    extent.putFloat("x", plane.getExtentX());
    extent.putFloat("z", plane.getExtentZ());
    output.putBundle("extent", extent);

    Plane parent = plane.getSubsumedBy();
    if (parent != null) {
      output.putBundle("parent", serializePlane(parent, new Bundle()));
    }

    output.putString("type", "plane");
    output.putString("planeType", serializePlaneType(plane.getType()));
    ArrayList anchors = serializeAnchors(plane.getAnchors());
    if (anchors != null) output.putParcelableArrayList("anchors", anchors);

    output.putInt("id", plane.hashCode());
    //TODO:Bacon: should we add this?
//    plane.getPolygon();
    return output;
  }

  private Bundle serializePointCloud(PointCloud pointCloud) {

    FloatBuffer floatBuffer = pointCloud.getPoints();
    float[] points = new float[floatBuffer.limit()];
    floatBuffer.get(points);
    double timestamp = pointCloud.getTimestamp();
    float[] pointsArray = new float[points.length / 4];

    int counter = 0;
    for (int i = 0; i < points.length; i += 4) {
      float buffers = points[i];
      pointsArray[counter++] = buffers;
    }
    Bundle map = new Bundle();
    map.putDouble("timestamp", timestamp);
    map.putFloatArray("points", pointsArray);

    return map;
  }

  private boolean cameraExistsOrReject(Promise promise) {
    if (mCamera != null) return true;
    promise.reject("E_NO_SESSION", "AR Camera is not initialized");
    return false;
  }

  public void getCameraTextureAsync(Promise promise) {
    if (!cameraExistsOrReject(promise)) return;
    promise.resolve(mCamera.getCameraTexture());
  }
}
