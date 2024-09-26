import AVFoundation

func statusToString(status: AVPlayer.Status) -> String {
  switch status {
  case .readyToPlay:
    return "readyToPlay"
  case .failed:
    return "failed"
  case .unknown:
    return "unknown"
  @unknown default:
    return "unknown"
  }
}

func timeControlStatusString(status: AVPlayer.TimeControlStatus) -> String {
  switch status {
  case .playing:
    return "playing"
  case .paused:
    return "paused"
  case .waitingToPlayAtSpecifiedRate:
    return "waitingToPlayAtSpecifiedRate"
  @unknown default:
    return "unknown"
  }
}

func reasonForWaitingToPlayString(status: AVPlayer.WaitingReason?) -> String {
  guard let status else {
    return "unknown"
  }

  switch status {
  case .evaluatingBufferingRate:
    return "evaluatingBufferingRate"
  case .noItemToPlay:
    return "noItemToPlay"
  case .toMinimizeStalls:
    return "toMinimizeStalls"
  default:
    return "unknown"
  }
}
