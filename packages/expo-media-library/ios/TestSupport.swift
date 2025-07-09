import Foundation
import Photos

class MockPHAsset: PHAsset {
  private var id: Int

  init(id: Int) {
    self.id = id
  }

  override var localIdentifier: String {
    return String(self.id)
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
