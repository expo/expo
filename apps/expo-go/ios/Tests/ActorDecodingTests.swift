// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class ActorDecodingTests: XCTestCase {
  private func decode(_ json: String) throws -> MeActorResponse {
    let data = try XCTUnwrap(json.data(using: .utf8))
    return try JSONDecoder().decode(MeActorResponse.self, from: data)
  }

  func testDecodesPartnerActorWithoutUserOnlyFields() throws {
    let response = try decode("""
    {"data":{"meActor":{
      "__typename":"PartnerActor",
      "id":"actor-1",
      "username":"partner-private-test",
      "accounts":[{"id":"acc-1","name":"partner-private-test","profileImageUrl":null,"ownerUserActor":null}]
    }}}
    """)

    let actor = try XCTUnwrap(response.data.meActor)
    XCTAssertEqual(actor.typename, "PartnerActor")
    XCTAssertEqual(actor.username, "partner-private-test")
    XCTAssertNil(actor.firstName)
    XCTAssertNil(actor.profilePhoto)
    XCTAssertNil(actor.bestContactEmail)
    XCTAssertEqual(actor.accounts.count, 1)
    XCTAssertEqual(actor.accounts[0].name, "partner-private-test")
    XCTAssertNil(actor.accounts[0].ownerUserActor)
  }

  func testDecodesRegularUserActor() throws {
    let response = try decode("""
    {"data":{"meActor":{
      "__typename":"User",
      "id":"actor-2",
      "username":"alanhughes",
      "firstName":"Alan",
      "lastName":"Hughes",
      "profilePhoto":"https://example.test/a.png",
      "bestContactEmail":"alan@expo.dev",
      "accounts":[{"id":"acc-2","name":"alanhughes","profileImageUrl":"https://example.test/b.png",
        "ownerUserActor":{"id":"actor-2","username":"alanhughes","profilePhoto":null,
          "firstName":"Alan","fullName":"Alan Hughes","lastName":"Hughes"}}]
    }}}
    """)

    let actor = try XCTUnwrap(response.data.meActor)
    XCTAssertEqual(actor.username, "alanhughes")
    XCTAssertEqual(actor.firstName, "Alan")
    XCTAssertEqual(actor.accounts[0].ownerUserActor?.username, "alanhughes")
  }

  func testDecodesNullActor() throws {
    let response = try decode(#"{"data":{"meActor":null}}"#)
    XCTAssertNil(response.data.meActor)
  }

  func testQueryRequestsUsernameOnBothActorTypes() {
    let query = Queries.getCurrentUser()
    XCTAssertTrue(query.contains("meActor"))
    XCTAssertTrue(query.contains("... on UserActor"))
    XCTAssertTrue(query.contains("... on PartnerActor"))
    XCTAssertFalse(query.contains("meUserActor"))
  }
}
