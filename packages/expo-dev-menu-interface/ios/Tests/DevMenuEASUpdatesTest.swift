import Quick
import Nimble

@testable import EXDevMenuInterface

class DevMenuEASUpdatesTest: QuickSpec {
  override func spec() {
    it("Channel constructor should populate all fields") {
      let seeder = [
        "id": "1234",
        "name": "channel-1",
        "createdAt": "1635508863",
        "updatedAt": "1635508873"
      ]

      let channel = DevMenuEASUpdates.Channel(dictionary: seeder)

      expect(channel.id).to(equal("1234"))
      expect(channel.name).to(equal("channel-1"))
      expect(channel.createdAt).to(equal("1635508863"))
      expect(channel.updatedAt).to(equal("1635508873"))
    }

    it("Update constructor should populate all fields") {
      let seeder = [
        "id": "1234",
        "message": "update-1",
        "platform": "ios",
        "runtimeVersion": "1",
        "createdAt": "1635508863",
        "updatedAt": "1635508873"
      ]

      let update = DevMenuEASUpdates.Update(dictionary: seeder)

      expect(update.id).to(equal("1234"))
      expect(update.message).to(equal("update-1"))
      expect(update.platform).to(equal("ios"))
      expect(update.runtimeVersion).to(equal("1"))
      expect(update.createdAt).to(equal("1635508863"))
      expect(update.updatedAt).to(equal("1635508873"))
    }

    it("Branch constructor should populate all fields") {
      let seeder = [
        "id": "1",
        "updates": [
          [
            "id": "1234",
            "message": "update-1",
            "platform": "ios",
            "runtimeVersion": "1",
            "createdAt": "1635508863",
            "updatedAt": "1635508873"
          ],
          [
            "id": "9876",
            "message": "update-2",
            "platform": "ios",
            "runtimeVersion": "2",
            "createdAt": "1635508863",
            "updatedAt": "1635508873"
          ]
        ]
      ] as [String: Any]

      let branch = DevMenuEASUpdates.Branch(dictionary: seeder)
      let update1 = branch.updates[0]
      let update2 = branch.updates[1]

      expect(branch.id).to(equal("1"))
      expect(update1.id).to(equal("1234"))
      expect(update1.message).to(equal("update-1"))
      expect(update1.platform).to(equal("ios"))
      expect(update1.runtimeVersion).to(equal("1"))
      expect(update1.createdAt).to(equal("1635508863"))
      expect(update1.updatedAt).to(equal("1635508873"))
      expect(update2.id).to(equal("9876"))
      expect(update2.message).to(equal("update-2"))
      expect(update2.platform).to(equal("ios"))
      expect(update2.runtimeVersion).to(equal("2"))
      expect(update2.createdAt).to(equal("1635508863"))
      expect(update2.updatedAt).to(equal("1635508873"))
    }
  }
}
