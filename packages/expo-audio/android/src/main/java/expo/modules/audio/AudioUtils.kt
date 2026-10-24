package expo.modules.audio

import android.content.Context
import android.media.AudioDeviceInfo
import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
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
    AudioDeviceInfo.TYPE_USB_DEVICE,
    AudioDeviceInfo.TYPE_USB_ACCESSORY,
    AudioDeviceInfo.TYPE_USB_HEADSET -> "USBAudio"
    AudioDeviceInfo.TYPE_BLE_HEADSET -> "BluetoothLE"
    AudioDeviceInfo.TYPE_LINE_ANALOG,
    AudioDeviceInfo.TYPE_LINE_DIGITAL -> "LineIn"
    AudioDeviceInfo.TYPE_HDMI -> "HDMI"
    AudioDeviceInfo.TYPE_BUS -> "CarAudio"
    else -> "Unknown device type"
  }
  map.putString("name", deviceInfo.productName.toString())
  map.putString("type", type)
  map.putString("uid", deviceInfo.id.toString())
  return map
}

@OptIn(UnstableApi::class)
fun buildBasicMediaSession(context: Context, player: Player, onPlay: () -> Unit): MediaSession {
  return MediaSession.Builder(context, PlayRequestingPlayer(player, onPlay))
    .setId("ExpoAudioBasicMediaSession_${player.hashCode()}")
    .build()
}
