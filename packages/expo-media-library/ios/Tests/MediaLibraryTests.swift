import Testing
import Photos
import CoreLocation

@testable import ExpoMediaLibrary

private let cursorPositionNotProvided = NSNotFound
private let numOfMockAssets = 4
private let sorter = [NSSortDescriptor(key: "pixelWidth", ascending: false)]

private func createTestAssets(_ numOfMockAssets: Int) -> [PHAsset] {
  return (0..<numOfMockAssets).map { index in
    return MockPHAsset(id: index)
  }
}

private let mockAssets = createTestAssets(numOfMockAssets)

@Suite("getAssets")
struct MediaLibraryTests {
  @Suite("given empty fetch result")
  struct GivenEmptyFetchResultTests {
    @Test
    func `returns no assets and indicates there is no next page`() {
      let emptyFetchResult = PHFetchResult<PHAsset>()
      for sortDescriptor in [nil, sorter] {
        let response = getAssets(fetchResult: emptyFetchResult,
                                 cursorIndex: cursorPositionNotProvided,
                                 numOfRequestedItems: 5,
                                 sortDescriptors: sortDescriptor)
        #expect(response.assets.isEmpty)
        #expect(response.totalCount == 0)
        #expect(response.hasNextPage == false)
      }
    }
  }

  @Suite("given a non-empty result")
  struct GivenNonEmptyResultTests {
    let fetchResult = MockFetchResult(assets: mockAssets)

    @Test
    func `requesting 0 items returns 0 assets and indicates there is a next page`() {
      for sortDescriptor in [nil, sorter] {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: cursorPositionNotProvided,
                                 numOfRequestedItems: 0,
                                 sortDescriptors: sortDescriptor)
        #expect(response.assets.isEmpty)
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage == true)
      }
    }

    @Test
    func `asking fewer items than available in fetchResult returns assets and indicates there is a next page`() {
      let requestedItems = 2

      for config in [(sortDescriptor: nil, expectedIds: ("3", "2")), // most recent first
                     (sortDescriptor: sorter, expectedIds: ("0", "1")) // insertion order
      ] {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: cursorPositionNotProvided,
                                 numOfRequestedItems: requestedItems,
                                 sortDescriptors: config.sortDescriptor)
        #expect(response.assets.count == requestedItems)
        #expect(response.assets[0]["id"] as? String == config.expectedIds.0)
        #expect(response.assets[1]["id"] as? String == config.expectedIds.1)
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage == true)
      }
    }

    @Test
    func `requesting full number of items / more items than in fetchResult, returns all assets and indicates there is NO next page`() {
      let expectedItems = 4

      for requestedItems in [numOfMockAssets, numOfMockAssets * 5] {
        for config in [(sortDescriptor: nil, expectedIds: ("3", "0")), // most recent first
                       (sortDescriptor: sorter, expectedIds: ("0", "3")) // insertion order
        ] {
          let response = getAssets(fetchResult: fetchResult,
                                   cursorIndex: cursorPositionNotProvided,
                                   numOfRequestedItems: requestedItems,
                                   sortDescriptors: config.sortDescriptor)
          #expect(response.assets.count == expectedItems)
          #expect(response.assets[0]["id"] as? String == config.expectedIds.0)
          #expect(response.assets[3]["id"] as? String == config.expectedIds.1)
          #expect(response.totalCount == numOfMockAssets)
          #expect(response.hasNextPage == false)
        }
      }
    }

    @Suite("custom cursor position is taken into account")
    struct CustomCursorPositionTests {
      let fetchResult = MockFetchResult(assets: mockAssets)

      @Test
      func `without sorting`() {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: 3,
                                 numOfRequestedItems: 2)
        #expect(response.assets.count == 2)
        #expect(response.assets[0]["id"] as? String == "2")
        #expect(response.assets[1]["id"] as? String == "1")
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage == true)
      }

      @Test
      func `with sorting`() {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: 0,
                                 numOfRequestedItems: 2,
                                 sortDescriptors: sorter)
        #expect(response.assets.count == 2)
        #expect(response.assets[0]["id"] as? String == "1")
        #expect(response.assets[1]["id"] as? String == "2")
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage == true)
      }
    }
  }
}

@Suite("exportLocation")
struct ExportLocationTests {
  @Test
  func `returns numeric latitude and longitude`() {
    let location = CLLocation(latitude: 1.23, longitude: 4.56)
    let exported = exportLocation(location: location)

    #expect(exported?["latitude"] as? Double == 1.23)
    #expect(exported?["longitude"] as? Double == 4.56)
  }

  @Test
  func `returns nil when location is unavailable`() {
    #expect(exportLocation(location: nil) == nil)
  }
}

@Suite("exportAsset")
struct ExportAssetTests {
  @Test
  func `includes location when asset has location metadata`() {
    let location = CLLocation(latitude: 1.23, longitude: 4.56)
    let asset = MockPHAsset(id: 0, location: location)

    let exported = exportAsset(asset: asset)
    #expect(exported["location"] as? [String: Double] == ["latitude": 1.23, "longitude": 4.56])
  }
}
