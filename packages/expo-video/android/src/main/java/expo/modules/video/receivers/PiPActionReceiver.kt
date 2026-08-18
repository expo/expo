package expo.modules.video.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import expo.modules.video.managers.PictureInPictureManager.Companion.VIDEO_VIEW_ID_KEY
import expo.modules.video.managers.VideoManager

class PiPActionReceiver: BroadcastReceiver() {
  override fun onReceive(context: Context?, intent: Intent?) {
    val action = intent?.action ?: return
    val videoViewId = intent.getStringExtra(VIDEO_VIEW_ID_KEY) ?: return

    VideoManager.pictureInPicture.onPiPRemoteAction(videoViewId, action)
  }
}