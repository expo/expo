// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class HomeScreenDataDecodingTests: XCTestCase {
  func testDecodesOrganizationAccountWithoutOwnerUserActor() throws {
    let json = """
    {"data":{"account":{"byName":{
      "id":"acc-org",
      "name":"myorg",
      "ownerUserActor":null,
      "appsPaginated":{"edges":[{"node":{
        "id":"app-1","name":"myapp","fullName":"@myorg/myapp",
        "ownerAccount":{"name":"myorg"},
        "firstTwoBranches":[]
      }}]},
      "snacksPaginated":{"edges":[]},
      "appCount":1
    }}}}
    """
    let data = try XCTUnwrap(json.data(using: .utf8))

    let response = try JSONDecoder().decode(HomeScreenDataResponse.self, from: data)

    XCTAssertEqual(response.data.account.byName.appsPaginated.edges.count, 1)
    XCTAssertEqual(response.data.account.byName.appsPaginated.edges[0].node.fullName, "@myorg/myapp")
    XCTAssertEqual(response.data.account.byName.appCount, 1)
  }

  func testHomeScreenQueryDoesNotSelectOwnerUserActor() {
    XCTAssertFalse(Queries.getHomeScreenData().contains("ownerUserActor"))
  }

  func testQueriesDoNotSelectDeprecatedRuntimeVersion() {
    for query in [
      Queries.getHomeScreenData(),
      Queries.getProjectsList(),
      Queries.getProjectDetails(),
      Queries.getBranchesList(),
      Queries.getBranchDetails()
    ] {
      XCTAssertFalse(query.contains("runtimeVersion"), query)
    }
  }

  func testHomeScreenQueryUsesAppsPaginated() {
    let query = Queries.getHomeScreenData()
    XCTAssertTrue(query.contains("appsPaginated(first: 5)"))
    XCTAssertFalse(query.contains("apps(limit"))
  }

  func testProjectsListDecodesPageInfo() throws {
    let json = """
    {"data":{"account":{"byName":{
      "id":"acc-1","name":"me",
      "appsPaginated":{
        "pageInfo":{"hasNextPage":true,"endCursor":"cursor-1"},
        "edges":[]
      }
    }}}}
    """
    let data = try XCTUnwrap(json.data(using: .utf8))
    let response = try JSONDecoder().decode(ProjectsListResponse.self, from: data)
    XCTAssertEqual(response.data.account.byName.appsPaginated.pageInfo?.hasNextPage, true)
    XCTAssertEqual(response.data.account.byName.appsPaginated.pageInfo?.endCursor, "cursor-1")
  }

  func testProjectsListQueryPagesByCursor() {
    let query = Queries.getProjectsList()
    XCTAssertTrue(query.contains("appsPaginated(first: $first, after: $after)"))
    XCTAssertTrue(query.contains("hasNextPage"))
    XCTAssertFalse(query.contains("$offset"))
  }

  func testHomeScreenQueryUsesSnacksPaginated() {
    let query = Queries.getHomeScreenData()
    XCTAssertTrue(query.contains("snacksPaginated(first: 5)"))
    XCTAssertFalse(query.contains("snacks(limit"))
  }

  func testSnacksListDecodesPageInfo() throws {
    let json = """
    {"data":{"account":{"byName":{
      "id":"acc-1","name":"me",
      "snacksPaginated":{
        "pageInfo":{"hasNextPage":false,"endCursor":null},
        "edges":[{"node":{"id":"s1","name":"Snack","description":null,"fullName":"@me/s1","slug":"s1","isDraft":false,"sdkVersion":"57.0.0"}}]
      }
    }}}}
    """
    let data = try XCTUnwrap(json.data(using: .utf8))
    let response = try JSONDecoder().decode(SnacksListResponse.self, from: data)
    XCTAssertEqual(response.data.account.byName.snacksPaginated.edges.count, 1)
    XCTAssertEqual(response.data.account.byName.snacksPaginated.edges[0].node.slug, "s1")
    XCTAssertEqual(response.data.account.byName.snacksPaginated.pageInfo?.hasNextPage, false)
  }

  func testSnacksListQueryPagesByCursor() {
    let query = Queries.getSnacksList()
    XCTAssertTrue(query.contains("snacksPaginated(first: $first, after: $after)"))
    XCTAssertFalse(query.contains("$offset"))
  }
}
