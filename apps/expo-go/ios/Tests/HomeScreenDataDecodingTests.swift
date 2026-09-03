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
      "apps":[{
        "id":"app-1","name":"myapp","fullName":"@myorg/myapp",
        "ownerAccount":{"name":"myorg"},
        "firstTwoBranches":[]
      }],
      "snacks":[],
      "appCount":1
    }}}}
    """
    let data = try XCTUnwrap(json.data(using: .utf8))

    let response = try JSONDecoder().decode(HomeScreenDataResponse.self, from: data)

    XCTAssertEqual(response.data.account.byName.apps.count, 1)
    XCTAssertEqual(response.data.account.byName.apps[0].fullName, "@myorg/myapp")
    XCTAssertEqual(response.data.account.byName.appCount, 1)
  }

  func testHomeScreenQueryDoesNotSelectOwnerUserActor() {
    XCTAssertFalse(Queries.getHomeScreenData().contains("ownerUserActor"))
  }
}
