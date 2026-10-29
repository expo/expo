import Foundation

protocol GeofencingSource {
  var updates: AsyncThrowingStream<GeofencingEvent, Error> { get }
  var hasEnded: Bool { get }
  func setRegions(_ regions: [GeofencingRegion])
  func stop()
}
