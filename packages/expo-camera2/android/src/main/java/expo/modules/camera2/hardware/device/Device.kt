package expo.modules.camera2.hardware.device

import android.content.Context
import expo.modules.camera2.exception.CameraException

import java.util.concurrent.ExecutorService

import kotlinx.coroutines.CompletableDeferred

import expo.modules.camera2.hardware.Display
import expo.modules.camera2.hardware.camera.CameraConfiguration
import expo.modules.camera2.hardware.camera.CameraController
import expo.modules.camera2.preview.Preview
import expo.modules.camera2.hardware.orientation.OrientationSensor
import expo.modules.camera2.settings.Facing
import expo.modules.camera2.utils.getCameraManager

/**
 * Aggregates all device-provided things (sensors etc.).
 * Is responsible for changing camera sensors according to provided facing.
 */
internal class Device(
        context: Context,
        val preview: Preview,
        val executor: ExecutorService
) {

  private val display = Display(context = context)
  internal val orientationSensor = OrientationSensor(
    context = context,
    display = display
  )
  private val cameraControllers = context.getCameraManager().cameraIdList.map {
    CameraController(
      context = context,
      cameraId = it,
      executor = executor
    )
  }
  private var selectedCameraController = CompletableDeferred<CameraController>()
  private var selectedFacing = Facing.DEFAULT
  internal var cameraConfiguration = CameraConfiguration.DEFAULT

  fun selectCamera() {
    cameraControllers.find { it.getFacing() == selectedFacing }
      ?.let(selectedCameraController::complete)
      ?: selectedCameraController.completeExceptionally(CameraException("Unsupported facing $selectedFacing"))
  }

  /**
   * @return `true` if a camera has been selected.
   */
  fun hasSelectedCamera() = selectedCameraController.isCompleted

  fun getSelectedCamera(): CameraController = selectedCameraController.getCompleted()

  fun clearSelectedCamera() {
    selectedCameraController = CompletableDeferred()
  }

  fun getFacing(): Facing = selectedFacing

  fun updateFacing(facing: Facing) {
    selectedFacing = facing
  }
}
