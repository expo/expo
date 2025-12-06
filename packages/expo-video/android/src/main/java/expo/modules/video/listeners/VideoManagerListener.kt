package expo.modules.video.listeners

import expo.modules.video.VideoView

// TODO: Add more as needed
interface VideoManagerListener {
  fun onVideoViewRegistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {}
  fun onVideoViewUnregistered(videoView: VideoView, allVideoViews: Collection<VideoView>) {}
  fun onAppBackgrounded() {}
  fun onAppForegrounded() {}
}