import Photos
import Testing
@testable import ExpoMediaLibrary

func createTestAssets(_ numOfMockAssets: Int) -> [PHAsset] {
  return (0..<numOfMockAssets).map { index in
    return MockPHAsset(id: index)
  }
}

struct MediaLibraryTests {
  
  @Suite("Retrieving assets")
  struct GetAssets {
    let cursorPositionNotProvided = NSNotFound
    let numOfMockAssets = 4
    let mockAssets: [PHAsset]
    let sorter = [NSSortDescriptor(key: "pixelWidth", ascending: false)]
    let fetchResult: MockFetchResult

    init() {
      self.mockAssets = createTestAssets(numOfMockAssets)
      self.fetchResult = MockFetchResult(assets: mockAssets)
    }

    @Test("returns no assets and indicates there is no next page") func returnEmptyResult() throws {
      let emptyFetchResult = PHFetchResult<PHAsset>()

      for sortDescriptor in [nil, sorter] {
        let response = getAssets(fetchResult: emptyFetchResult,
                                 cursorIndex: cursorPositionNotProvided,
                                 numOfRequestedItems: 5,
                                 sortDescriptors: sortDescriptor)
        #expect(response.assets.isEmpty)
        #expect(response.totalCount == 0)
        #expect(!response.hasNextPage)
      }
    }

    @Test("requesting 0 items returns 0 assets and indicates there is a next page") func requestingAssets() throws {
      for sortDescriptor in [nil, sorter] {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: cursorPositionNotProvided,
                                 numOfRequestedItems: 0,
                                 sortDescriptors: sortDescriptor)
        #expect(response.assets.isEmpty)
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage)
      }
    }

    @Test("asking fewer items than available in fetchResult returns assets and indicates there is a next page") func fewerItemsThanAvailable() {
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
        #expect(response.hasNextPage)
      }
    }

    @Test("requesting full number of items / more items than in fetchResult, returns all assets and indicates there is NO next page") func returnsAllAssetsNoNextPage() {
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
          #expect(!response.hasNextPage)
        }
      }
    }

    @Suite("Cursor index is taken into account")
    struct Cursor {
      let numOfMockAssets = 4
      let sorter = [NSSortDescriptor(key: "pixelWidth", ascending: false)]
      let fetchResult: MockFetchResult

      init() {
        self.fetchResult = MockFetchResult(assets: createTestAssets(numOfMockAssets))
      }
      
      @Test("without sorting") func withoutSorting() {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: 3,
                                 numOfRequestedItems: 2)
        #expect(response.assets.count == 2)
        #expect(response.assets[0]["id"] as? String == "2")
        #expect(response.assets[1]["id"] as? String == "1")
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage)
      }

      @Test("with sorting") func withSorting() {
        let response = getAssets(fetchResult: fetchResult,
                                 cursorIndex: 0,
                                 numOfRequestedItems: 2,
                                 sortDescriptors: sorter)
        #expect(response.assets.count == 2)
        #expect(response.assets[0]["id"] as? String == "1")
        #expect(response.assets[1]["id"] as? String == "2")
        #expect(response.totalCount == numOfMockAssets)
        #expect(response.hasNextPage)
      }
    }
  }
}
