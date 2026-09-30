import AppIntents
import Foundation
import Testing

@testable import ExpoAppIntents
@testable import ExpoModulesCore

/// `IntentDonationIdentifier` has no public initializer; only the system hands one out. Decoding its
/// Codable form is the one way a test can make one without donating to the device.
private func makeDonationIdentifier() throws -> IntentDonationIdentifier {
  let json = #"{"id":"\#(UUID().uuidString)"}"#
  return try JSONDecoder().decode(IntentDonationIdentifier.self, from: Data(json.utf8))
}

private func donationId(for identifier: IntentDonationIdentifier) throws -> String {
  return try #require(String(bytes: JSONEncoder().encode(identifier), encoding: .utf8))
}

private struct GreetingIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field var greeting: String = ""
  }

  static var title: LocalizedStringResource { "Greeting" }

  var greeting = ""

  init() {}

  init(donationParams: DonationParams) {
    greeting = donationParams.greeting
  }

  func perform() async throws -> some IntentResult {
    return .result()
  }
}

private struct AddToCounterIntent: DonatableAppIntent {
  struct DonationParams: Record {
    @Field(.required) var amount: Int = 0
  }

  static var title: LocalizedStringResource { "Add to counter" }

  var amount = 0

  init() {}

  init(donationParams: DonationParams) {
    amount = donationParams.amount
  }

  func perform() async throws -> some IntentResult {
    return .result()
  }
}

/// Declares neither `DonationParams` nor `init(donationParams:)`, so it gets `NoDonationParams` and
/// the default initializer.
private struct ParameterlessIntent: DonatableAppIntent {
  static var title: LocalizedStringResource { "Parameterless" }

  func perform() async throws -> some IntentResult {
    return .result()
  }
}

private struct UnbuildableIntent: DonatableAppIntent {
  struct MissingParam: Error, CustomStringConvertible {
    var description: String { "the dishId param is missing" }
  }

  static var title: LocalizedStringResource { "Unbuildable" }

  init() {}

  init(donationParams: NoDonationParams) throws {
    throw MissingParam()
  }

  func perform() async throws -> some IntentResult {
    return .result()
  }
}

private struct DonationTestEntity: AppEntity {
  static var typeDisplayRepresentation: TypeDisplayRepresentation { "Donation test entity" }
  static var defaultQuery: Query { Query() }

  let id: String

  var displayRepresentation: DisplayRepresentation {
    DisplayRepresentation(title: "\(id)")
  }

  struct Query: EntityQuery {
    func entities(for identifiers: [String]) async throws -> [DonationTestEntity] {
      return []
    }
  }
}

/// Stands in for `IntentDonationManager`, keeping what it was asked to do. Deleting by id echoes the
/// id back, the way the system reports the donation it removed, unless that id is set to fail.
private final class RecordingDonor: AppIntentDonor, @unchecked Sendable {
  struct DeletionFailure: Error, CustomStringConvertible {
    var description: String { "the donation store is unavailable" }
  }

  private struct State {
    var donated: [any AppIntent] = []
    var matches: [AppIntentDonationMatch] = []
  }

  private let state = Mutex(State())
  private let failingDeletions: [IntentDonationIdentifier]
  let identifier: IntentDonationIdentifier

  init(failingToDelete failingDeletions: [IntentDonationIdentifier] = []) throws {
    identifier = try makeDonationIdentifier()
    self.failingDeletions = failingDeletions
  }

  var donated: [any AppIntent] {
    state.withLock { $0.donated }
  }

  var matches: [AppIntentDonationMatch] {
    state.withLock { $0.matches }
  }

  func donate(_ intent: any AppIntent) async throws -> IntentDonationIdentifier {
    state.withLock { $0.donated.append(intent) }
    return identifier
  }

  func deleteDonations(matching match: AppIntentDonationMatch) async throws -> [IntentDonationIdentifier] {
    state.withLock { $0.matches.append(match) }
    guard case .donation(let identifier) = match else {
      return [self.identifier]
    }
    if failingDeletions.contains(identifier) {
      throw DeletionFailure()
    }
    return [identifier]
  }

  var idDeletionAttempts: [IntentDonationIdentifier] {
    return matches.compactMap { match in
      guard case .donation(let identifier) = match else {
        return nil
      }
      return identifier
    }
  }
}

@Suite("AppIntentDonationRegistry")
struct AppIntentDonationRegistryTests {
  private let donor: RecordingDonor
  private let entities = AppEntityIdentifierRegistry()
  private let registry: AppIntentDonationRegistry
  private let appContext = AppContext.create()

  init() throws {
    donor = try RecordingDonor()
    registry = AppIntentDonationRegistry(donor: donor, entities: entities)
    registry.register("greeting", as: GreetingIntent.self)
  }

  @Test
  func `donating builds the registered intent from the params`() async throws {
    _ = try await registry.donate("greeting", params: ["greeting": "hello"], appContext: appContext)

    let donated = try #require(donor.donated.first as? GreetingIntent)
    #expect(donor.donated.count == 1)
    #expect(donated.greeting == "hello")
  }

  /// JavaScript has one number type, so a whole number arrives as a `Double`.
  @Test
  func `a whole number from JavaScript fills an Int field`() async throws {
    registry.register("addToCounter", as: AddToCounterIntent.self)

    _ = try await registry.donate("addToCounter", params: ["amount": 5.0], appContext: appContext)

    let donated = try #require(donor.donated.first as? AddToCounterIntent)
    #expect(donated.amount == 5)
  }

  @Test
  func `a missing required param throws naming the intent and the param without donating`()
    async throws
  {
    registry.register("addToCounter", as: AddToCounterIntent.self)

    let error = await #expect(throws: InvalidDonationParamsException.self) {
      _ = try await registry.donate("addToCounter", params: [:], appContext: appContext)
    }

    let reason = try #require(error?.reason)
    #expect(reason.contains("'addToCounter'"))
    #expect(error?.isCausedBy(FieldRequiredException.self) == true, "the record's error is the cause")
    #expect(error?.description.contains("amount") == true, "the cause names the missing field")
    #expect(donor.donated.isEmpty)
  }

  @Test
  func `a param of the wrong type throws without donating`() async throws {
    registry.register("addToCounter", as: AddToCounterIntent.self)

    await #expect(throws: InvalidDonationParamsException.self) {
      _ = try await registry.donate("addToCounter", params: ["amount": "five"], appContext: appContext)
    }
    #expect(donor.donated.isEmpty)
  }

  @Test
  func `an intent without donation params ignores the params it is given`() async throws {
    registry.register("parameterless", as: ParameterlessIntent.self)

    _ = try await registry.donate("parameterless", params: ["unused": "value"], appContext: appContext)

    #expect(donor.donated.first is ParameterlessIntent)
  }

  @Test
  func `a donation id deletes the donation it came from`() async throws {
    let id = try await registry.donate("greeting", params: [:], appContext: appContext)

    let deleted = try await registry.deleteDonations(matching: .ids([id]))

    #expect(donor.idDeletionAttempts == [donor.identifier])
    #expect(deleted == [id], "a deleted id reads back as the string donateIntentAsync returned")
  }

  @Test
  func `deleting several ids deletes each one and returns them all`() async throws {
    let identifiers = try (0..<3).map { _ in try makeDonationIdentifier() }
    let ids = try identifiers.map(donationId(for:))

    let deleted = try await registry.deleteDonations(matching: .ids(ids))

    #expect(donor.idDeletionAttempts == identifiers)
    #expect(deleted == ids)
  }

  @Test
  func `a failed id deletion still attempts the rest and names both groups`() async throws {
    let identifiers = try (0..<3).map { _ in try makeDonationIdentifier() }
    let ids = try identifiers.map(donationId(for:))
    let donor = try RecordingDonor(failingToDelete: [identifiers[1]])
    let registry = AppIntentDonationRegistry(donor: donor, entities: entities)

    let error = await #expect(throws: PartialDonationDeletionException.self) {
      _ = try await registry.deleteDonations(matching: .ids(ids))
    }

    #expect(donor.idDeletionAttempts == identifiers, "ids after the failed one are still attempted")
    #expect(error?.param.deleted == [ids[0], ids[2]])
    #expect(error?.param.failed == [ids[1]])
    let reason = try #require(error?.reason)
    #expect(reason.contains(ids[0]) && reason.contains(ids[1]) && reason.contains(ids[2]))
    #expect(error?.cause is RecordingDonor.DeletionFailure, "the first system error is the cause")
  }

  @Test
  func `a deletion where every id fails does not claim that some were deleted`() async throws {
    let identifiers = try (0..<2).map { _ in try makeDonationIdentifier() }
    let ids = try identifiers.map(donationId(for:))
    let donor = try RecordingDonor(failingToDelete: identifiers)
    let registry = AppIntentDonationRegistry(donor: donor, entities: entities)

    let error = await #expect(throws: PartialDonationDeletionException.self) {
      _ = try await registry.deleteDonations(matching: .ids(ids))
    }

    #expect(error?.param.deleted == [])
    #expect(error?.param.failed == ids)
    let reason = try #require(error?.reason)
    #expect(reason.contains("could not delete every donation"))
  }

  @Test
  func `an intent that cannot be built from the params throws naming the intent and the cause`()
    async throws
  {
    registry.register("unbuildable", as: UnbuildableIntent.self)

    let error = await #expect(throws: DonationIntentInitException.self) {
      _ = try await registry.donate("unbuildable", params: [:], appContext: appContext)
    }

    let reason = try #require(error?.reason)
    #expect(reason.contains("'unbuildable'"))
    #expect(reason.contains("the dishId param is missing"))
    #expect(donor.donated.isEmpty)
  }

  @Test
  func `registering a name again replaces the earlier intent`() async throws {
    registry.register("greeting", as: UnbuildableIntent.self)

    await #expect(throws: DonationIntentInitException.self) {
      _ = try await registry.donate("greeting", params: [:], appContext: appContext)
    }
  }

  @Test
  func `donating an unregistered name throws without donating`() async throws {
    await #expect(throws: UnregisteredDonationIntentException.self) {
      _ = try await registry.donate("missing", params: [:], appContext: appContext)
    }
    #expect(donor.donated.isEmpty)
  }

  @Test(arguments: ["", "not an id", "{}", #"{"id":"not a uuid"}"#])
  func `a malformed donation id throws without deleting anything`(id: String) async throws {
    let valid = try await registry.donate("greeting", params: [:], appContext: appContext)

    await #expect(throws: InvalidDonationIdentifierException.self) {
      _ = try await registry.deleteDonations(matching: .ids([valid, id]))
    }
    #expect(donor.matches.isEmpty, "a batch with one unreadable id must not delete the rest")
  }

  @Test
  func `deleting by intent name matches the registered intent type`() async throws {
    _ = try await registry.deleteDonations(matching: .intent("greeting"))

    guard case .intentType(let intentType) = try #require(donor.matches.first) else {
      Issue.record("expected deletion by intent type, got \(donor.matches)")
      return
    }
    #expect(ObjectIdentifier(intentType) == ObjectIdentifier(GreetingIntent.self))
  }

  @Test
  func `deleting by an unregistered intent name throws`() async throws {
    await #expect(throws: UnregisteredDonationIntentException.self) {
      _ = try await registry.deleteDonations(matching: .intent("missing"))
    }
    #expect(donor.matches.isEmpty)
  }

  @Test
  func `deleting by entity matches the registered entity identifier`() async throws {
    entities.register("donationTestEntity", as: DonationTestEntity.self)

    _ = try await registry.deleteDonations(matching: .entity("donationTestEntity", id: "e1"))

    guard case .entity(let identifier) = try #require(donor.matches.first) else {
      Issue.record("expected deletion by entity identifier, got \(donor.matches)")
      return
    }
    #expect(identifier == EntityIdentifier(for: DonationTestEntity.self, identifier: "e1"))
  }

  @Test
  func `deleting by an unregistered entity throws`() async throws {
    await #expect(throws: UnregisteredDonationEntityException.self) {
      _ = try await registry.deleteDonations(matching: .entity("missing", id: "e1"))
    }
    #expect(donor.matches.isEmpty)
  }
}
