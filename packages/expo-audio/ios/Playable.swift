import Foundation

internal protocol Playable: AnyObject {
  var id: String { get }
  var isPlaying: Bool { get }
  var wasPlaying: Bool { get set }
  var volume: Float { get set }
  func pause()
  func resumePlayback()
}
