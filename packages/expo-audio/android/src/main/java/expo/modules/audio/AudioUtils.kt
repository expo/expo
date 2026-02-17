package expo.modules.audio

import android.content.Context
import android.media.AudioDeviceInfo
import android.os.Bundle
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import java.io.File
import java.io.IOException

fun ensureDirExists(dir: File): File {
  if (!(dir.isDirectory || dir.mkdirs())) {
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
  map.putString("name", deviceInfo.productName.toString())
  map.putString("type", type)
  map.putString("uid", deviceInfo.id.toString())
  return map
}

fun buildBasicMediaSession(context: Context, player: ExoPlayer): MediaSession {
  return MediaSession.Builder(context, player)
    .setId("ExpoAudioBasicMediaSession_${player.hashCode()}")
    .build()
}
