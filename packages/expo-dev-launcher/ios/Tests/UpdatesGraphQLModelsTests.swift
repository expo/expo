// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest

@testable import EXDevLauncher

class UpdatesGraphQLModelsTests: XCTestCase {
  func testDecodesCompatibleUpdatePreview() throws {
    let json = """
    {
      "data": {
        "app": {
          "byId": {
            "branchesPaginated": {
              "pageInfo": {
                "hasNextPage": true,
                "endCursor": "cursor-2"
              },
              "edges": [
                {
                  "cursor": "cursor-1",
                  "node": {
                    "id": "branch-id",
                    "name": "production",
                    "compatibleUpdates": [
                      {
                        "id": "update-id",
                        "message": "Release 1",
                        "runtimeVersion": "1.0.0",
                        "createdAt": "2026-09-21T12:00:00.000Z",
                        "manifestPermalink": "https://u.expo.dev/update-id"
                      }
                    ]
                  }
                }
              ]
            }
          }
        }
      }
    }
    """

    let response = try JSONDecoder().decode(BranchesResponse.self, from: Data(json.utf8))
    let connection = response.data.app.byId.branchesPaginated
    let branch = try XCTUnwrap(connection.branches.first)
    let update = try XCTUnwrap(branch.compatibleUpdate)

    XCTAssertTrue(connection.pageInfo.hasNextPage)
    XCTAssertEqual(connection.pageInfo.endCursor, "cursor-2")
    XCTAssertEqual(branch.id, "branch-id")
    XCTAssertEqual(branch.name, "production")
    XCTAssertEqual(update.id, "update-id")
    XCTAssertEqual(update.message, "Release 1")
    XCTAssertEqual(update.runtimeVersion, "1.0.0")
    XCTAssertEqual(update.createdAt, "2026-09-21T12:00:00.000Z")
    XCTAssertEqual(update.manifestPermalink, "https://u.expo.dev/update-id")
  }

  func testDecodesBranchWithoutCompatibleUpdate() throws {
    let json = """
    {
      "data": {
        "app": {
          "byId": {
            "branchesPaginated": {
              "pageInfo": { "hasNextPage": false, "endCursor": null },
              "edges": [
                {
                  "cursor": "cursor-1",
                  "node": { "id": "branch-id", "name": "staging", "compatibleUpdates": [] }
                }
              ]
            }
          }
        }
      }
    }
    """

    let response = try JSONDecoder().decode(BranchesResponse.self, from: Data(json.utf8))
    let connection = response.data.app.byId.branchesPaginated
    let branch = try XCTUnwrap(connection.branches.first)

    XCTAssertFalse(connection.pageInfo.hasNextPage)
    XCTAssertNil(connection.pageInfo.endCursor)
    XCTAssertNil(branch.compatibleUpdate)
  }

  func testOffsetPaginationTracksOffsetAndRemainingPages() {
    var pagination = OffsetPaginationState(pageSize: 50)

    pagination.didReceivePage(itemCount: 50)

    XCTAssertEqual(pagination.offset, 50)
    XCTAssertTrue(pagination.hasMore)

    pagination.didReceivePage(itemCount: 3)

    XCTAssertEqual(pagination.offset, 53)
    XCTAssertFalse(pagination.hasMore)
  }

  func testOffsetPaginationResetReturnsToFirstPage() {
    var pagination = OffsetPaginationState(pageSize: 20)

    pagination.didReceivePage(itemCount: 20)
    pagination.didReceivePage(itemCount: 1)
    XCTAssertFalse(pagination.hasMore)

    pagination.reset()

    XCTAssertEqual(pagination.offset, 0)
    XCTAssertTrue(pagination.hasMore)
    XCTAssertEqual(pagination.pageSize, 20)
  }

  func testCursorPaginationTracksCursorFromPageInfo() {
    var pagination = CursorPaginationState(pageSize: 20)

    XCTAssertNil(pagination.cursor)
    XCTAssertTrue(pagination.hasMore)

    pagination.didReceivePage(endCursor: "cursor-20", hasNextPage: true)

    XCTAssertEqual(pagination.cursor, "cursor-20")
    XCTAssertTrue(pagination.hasMore)

    pagination.didReceivePage(endCursor: "cursor-31", hasNextPage: false)

    XCTAssertEqual(pagination.cursor, "cursor-31")
    XCTAssertFalse(pagination.hasMore)
  }

  func testCursorPaginationResetClearsCursor() {
    var pagination = CursorPaginationState(pageSize: 20)

    pagination.didReceivePage(endCursor: "cursor-20", hasNextPage: false)
    pagination.reset()

    XCTAssertNil(pagination.cursor)
    XCTAssertTrue(pagination.hasMore)
    XCTAssertEqual(pagination.pageSize, 20)
  }
}
