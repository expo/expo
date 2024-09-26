import ExpoModulesTestCore
import Photos
@testable import ExpoMediaLibrary

class MediaLibrarySpec: ExpoSpec {

  static func createTestAssets(_ numOfMockAssets: Int) -> [PHAsset] {
    return (0..<numOfMockAssets).map { index in
      return MockPHAsset(id: index)
    }
  }

  override class func spec() {

    describe("getAssets") {
      let cursorPositionNotProvided = NSNotFound
      let numOfMockAssets = 4
      let mockAssets = createTestAssets(numOfMockAssets)
      let sorter = [NSSortDescriptor(key: "pixelWidth", ascending: false)]

      context("given empty fetch result") {
        it("returns no assets and indicates there is no next page") {
          let emptyFetchResult = PHFetchResult<PHAsset>()
          for sortDescriptor in [nil, sorter] {
            let response = getAssets(fetchResult: emptyFetchResult,
                                     cursorIndex: cursorPositionNotProvided,
                                     numOfRequestedItems: 5,
                                     sortDescriptors: sortDescriptor)
            expect(response.assets).to(beEmpty())
            expect(response.totalCount).to(equal(0))
            expect(response.hasNextPage).to(beFalse())
          }
        }
      }

      context("given a non-empty result") {
        let fetchResult = MockFetchResult(assets: mockAssets)

        it("requesting 0 items returns 0 assets and indicates there is a next page") {
          for sortDescriptor in [nil, sorter] {
            let response = getAssets(fetchResult: fetchResult,
                                     cursorIndex: cursorPositionNotProvided,
                                     numOfRequestedItems: 0,
                                     sortDescriptors: sortDescriptor)
            expect(response.assets).to(beEmpty())
            expect(response.totalCount).to(equal(numOfMockAssets))
            expect(response.hasNextPage).to(beTrue())
          }
        }

        it("asking fewer items than available in fetchResult returns assets and indicates there is a next page") {
          let requestedItems = 2

          for config in [(sortDescriptor: nil, expectedIds: ("3", "2")), // most recent first
                         (sortDescriptor: sorter, expectedIds: ("0", "1")) // insertion order
          ] {
            let response = getAssets(fetchResult: fetchResult,
                                     cursorIndex: cursorPositionNotProvided,
                                     numOfRequestedItems: requestedItems,
                                     sortDescriptors: config.sortDescriptor)
            expect(response.assets.count).to(equal(requestedItems))
            expect(response.assets[0]["id"] as? String).to(equal(config.expectedIds.0))
            expect(response.assets[1]["id"] as? String).to(equal(config.expectedIds.1))
            expect(response.totalCount).to(equal(numOfMockAssets))
            expect(response.hasNextPage).to(beTrue())
          }
        }

        it("requesting full number of items / more items than in fetchResult, returns all assets and indicates there is NO next page") {
          let expectedItems = 4

          for requestedItems in [numOfMockAssets, numOfMockAssets * 5] {
            for config in [(sortDescriptor: nil, expectedIds: ("3", "0")), // most recent first
                           (sortDescriptor: sorter, expectedIds: ("0", "3")) // insertion order
            ] {
              let response = getAssets(fetchResult: fetchResult,
                                       cursorIndex: cursorPositionNotProvided,
                                       numOfRequestedItems: requestedItems,
                                       sortDescriptors: config.sortDescriptor)
              expect(response.assets.count).to(equal(expectedItems))
              expect(response.assets[0]["id"] as? String).to(equal(config.expectedIds.0))
              expect(response.assets[3]["id"] as? String).to(equal(config.expectedIds.1))
              expect(response.totalCount).to(equal(numOfMockAssets))
              expect(response.hasNextPage).to(beFalse())
            }
          }
        }

        context("custom cursor position is taken into account") {
          it("without sorting") {
            let response = getAssets(fetchResult: fetchResult,
                                     cursorIndex: 3,
                                     numOfRequestedItems: 2)
            expect(response.assets.count).to(equal(2))
            expect(response.assets[0]["id"] as? String).to(equal("2"))
            expect(response.assets[1]["id"] as? String).to(equal("1"))
            expect(response.totalCount).to(equal(numOfMockAssets))
            expect(response.hasNextPage).to(beTrue())
          }

          it("with sorting") {
            let response = getAssets(fetchResult: fetchResult,
                                     cursorIndex: 0,
                                     numOfRequestedItems: 2,
                                     sortDescriptors: sorter)
            expect(response.assets.count).to(equal(2))
            expect(response.assets[0]["id"] as? String).to(equal("1"))
            expect(response.assets[1]["id"] as? String).to(equal("2"))
            expect(response.totalCount).to(equal(numOfMockAssets))
            expect(response.hasNextPage).to(beTrue())
          }
        }
      }
    }
  }
}
