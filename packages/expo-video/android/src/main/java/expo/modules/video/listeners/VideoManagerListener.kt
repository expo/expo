package expo.modules.video.listeners

import expo.modules.video.VideoView

interface VideoManagerListener {
  fun onVideoViewRegistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {}
  fun onVideoViewUnregistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {}
  fun onAppBackgrounded() {}
  fun onAppForegrounded() {}
}
