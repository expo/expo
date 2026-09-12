import Foundation
import Photos
import CoreLocation

class MockPHAsset: PHAsset {
  private var id: Int
  private var mockLocation: CLLocation?

  init(id: Int, location: CLLocation? = nil) {
    self.id = id
    self.mockLocation = location
  }

  override var localIdentifier: String {
    return String(self.id)
  }

  override var location: CLLocation? {
    return mockLocation
  }
}

// we override exactly those methods that `getAssets()` uses, imitating Apple's implementation
class MockFetchResult: PHFetchResult<PHAsset> {
  private var assets: [PHAsset]

  init(assets: [PHAsset]) {
    self.assets = assets
  }

  override var count: Int {
    return assets.count
  }

  override func object(at index: Int) -> PHAsset {
    assert(index >= 0 && index < assets.count, "Index out of range. Index \(index) but only \(assets.count) items are available.")
    return assets[index]
  }
}
