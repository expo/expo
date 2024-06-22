package expo.modules.audio

import android.media.AudioDeviceInfo
import android.os.Bundle
import java.io.File
import java.io.IOException

fun ensureDirExists(dir: File): File {
  if (!(dir.isDirectory() || dir.mkdirs())) {
    throw IOException("Couldn't create directory '$dir'")
  }
  return dir
}

fun getMapFromDeviceInfo(deviceInfo: AudioDeviceInfo): Bundle {
  val map = Bundle()
  val type = when (deviceInfo.type) {
    AudioDeviceInfo.TYPE_BUILTIN_MIC -> "MicrophoneBuiltIn"
    AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "BluetoothSCO"
    AudioDeviceInfo.TYPE_BLUETOOTH_A2DP -> "BluetoothA2DP"
    AudioDeviceInfo.TYPE_TELEPHONY -> "Telephony"
    AudioDeviceInfo.TYPE_WIRED_HEADSET -> "MicrophoneWired"
    else -> "Unknown device type"
  }
  map.putString("name", deviceInfo.getProductName().toString())
  map.putString("type", type)
  map.putString("uid", deviceInfo.id.toString())
  return map
}
