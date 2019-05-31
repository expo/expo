package expo.modules.camera2.settings

import android.hardware.camera2.CameraDevice

/**
 * Class that aggregates all settings that [CameraController] needs to adjust [CameraDevice].
 * Moreover this class is responsible for triggering [CameraController] upon settings change.
 */
class Settings {

  internal interface OnSettingsChangedListener {
    fun onCaptureSettingsChanged()
    fun onCameraSensorChanged()
  }

  /**
   * Listener to be notified upon settings change.
   */
  internal var onSettingsChangedListener: OnSettingsChangedListener? = null

  var facing: Facing = Facing.DEFAULT
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  var flash: Flash = Flash.DEFAULT
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  var autofocus: Autofocus = Autofocus.DEFAULT
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  var hdr: HDR = HDR.DEFAULT
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  var mode: Mode = Mode.DEFAULT
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  var whiteBalance: WhiteBalance = WhiteBalance.DEFAULT
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  /**
   * focusDepth should be between 0.0 (infinity focus) and 1.0 (focus as close as possible)
   */
  var focusDepth: Float = 0.toFloat()
    set(value) {
      if (field != value) {
        field = value
        dispatchSettingsChange()
      }
    }

  /**
   * zoom should be between 0.0 (not zoomed) and 1.0 (maximum zoom)
   */
  var zoom: Float = 0.toFloat()
    set(value) {
      if (field != value) {
        field = value
        dispatchSettingsChange()
      }
    }

  /**
   * null value specifies default value for camera sensor
   */
  var pictureSize: Float? = null
    set(value) {
      if (field !== value) {
        field = value
        dispatchSettingsChange()
      }
    }

  internal fun setOnChangedListener(listener: OnSettingsChangedListener) {
    onSettingsChangedListener = listener
  }

  private fun dispatchSettingsChange() {
    if (onSettingsChangedListener == null) {
      throw IllegalStateException("Settings.OnChangeListener is not configured")
    }
    onSettingsChangedListener!!.onCameraSensorChanged()
  }
}
