import AppIntents
import ExpoModulesCore
import Foundation

/// An `AppIntent` that JavaScript can donate by name with `donateIntentAsync()`.
///
/// A donation tells the system that the user just did this in the app, so Siri, Spotlight and the
/// Shortcuts app can suggest it later. The system needs a real intent value to learn from, and only
/// the app target can build one, so each donatable intent builds itself from the params that
/// JavaScript passed.
///
/// The params arrive as the intent's `DonationParams` record, so each field already has the type the
/// intent declares, and a missing required field is rejected before the intent is built. An intent
/// that takes no params from JavaScript can leave out both `DonationParams` and `init(donationParams:)`.
public protocol DonatableAppIntent: AppIntent {
  associatedtype DonationParams: Record = NoDonationParams

  init(donationParams: DonationParams) async throws
}

/// The `DonationParams` of an intent that takes no params from JavaScript. Any params passed are
/// ignored.
public struct NoDonationParams: Record {
  public init() {}
}

extension DonatableAppIntent where DonationParams == NoDonationParams {
  /// An intent without params needs no donation code of its own: conforming is enough.
  public init(donationParams: NoDonationParams) {
    self.init()
  }
}

internal enum AppIntentDonationFilter {
  case ids([String])
  case intent(String)
  case entity(String, id: String)
}

/// The system predicate a filter resolves to. `IntentDonationMatchingPredicate` is opaque, so this is
/// what the donor is handed instead, and what tests can inspect.
internal enum AppIntentDonationMatch {
  case donation(IntentDonationIdentifier)
  case intentType(any AppIntent.Type)
  case entity(EntityIdentifier)
}

/// The calls made to `IntentDonationManager`, behind a protocol so tests never donate to the device.
internal protocol AppIntentDonor: Sendable {
  func donate(_ intent: any AppIntent) async throws -> IntentDonationIdentifier
  func deleteDonations(matching match: AppIntentDonationMatch) async throws -> [IntentDonationIdentifier]
}

internal struct SystemAppIntentDonor: AppIntentDonor {
  func donate(_ intent: any AppIntent) async throws -> IntentDonationIdentifier {
    return try await IntentDonationManager.shared.donate(intent: intent)
  }

  func deleteDonations(matching match: AppIntentDonationMatch) async throws -> [IntentDonationIdentifier] {
    let manager = IntentDonationManager.shared
    switch match {
    case .donation(let identifier):
      return try await manager.deleteDonations(matching: .donationIdentifier(identifier))
    case .intentType(let intentType):
      return try await manager.deleteDonations(matching: .intentType(intentType))
    case .entity(let identifier):
      return try await manager.deleteDonations(matching: .entityIdentifier(identifier))
    }
  }
}

/// Maps the names JavaScript donates by to the app-target intent types that can be donated.
///
/// Register each intent in the `OnCreate` of the `AppIntentsSetup` inline module. The name only has to
/// match what JavaScript passes to `donateIntentAsync()` and `deleteDonationsAsync({ intent })`.
/// Nothing links it to the name the intent passes to `AppIntentDispatcher.shared.dispatch(name:params:)`,
/// but reusing that name, where there is one, gives JavaScript one name per intent.
public final class AppIntentDonationRegistry: Sendable {
  public static let shared = AppIntentDonationRegistry()

  /// What `register(_:as:)` keeps for one name. The intent type is erased so that intents with
  /// different `DonationParams` can share the registry, and `makeIntent` keeps the concrete type
  /// that converting the params needs.
  private struct Registration: Sendable {
    let intentType: any AppIntent.Type
    let makeIntent: @Sendable ([String: Any], AppContext) async throws -> any AppIntent
  }

  /// Registration happens on the main actor from `OnCreate`, while lookups come from the module's
  /// async functions at the same time.
  private let registrations = Mutex<[String: Registration]>([:])
  private let donor: any AppIntentDonor
  private let entities: AppEntityIdentifierRegistry

  internal init(
    donor: any AppIntentDonor = SystemAppIntentDonor(),
    entities: AppEntityIdentifierRegistry = .shared
  ) {
    self.donor = donor
    self.entities = entities
  }

  /// Registering a name again replaces its earlier intent. Deleting by `{ intent }` deletes by intent
  /// type, so when two names are registered for one type, deleting by either name deletes the
  /// donations made under both.
  public func register<Intent: DonatableAppIntent>(_ name: String, as intentType: Intent.Type) {
    let registration = Registration(intentType: intentType) { params, appContext in
      let donationParams: Intent.DonationParams
      do {
        donationParams = try Intent.DonationParams.from(dictionary: params, appContext: appContext)
      } catch {
        throw InvalidDonationParamsException((intent: name, paramsType: "\(Intent.DonationParams.self)")).causedBy(
          error
        )
      }
      do {
        return try await Intent(donationParams: donationParams)
      } catch {
        throw DonationIntentInitException((intent: name, error: error))
      }
    }
    registrations.withLock {
      $0[name] = registration
    }
  }

  /// Builds the intent registered as `name` from `params`, donates it, and returns the donation id
  /// JavaScript can later delete it by.
  internal func donate(_ name: String, params: [String: Any], appContext: AppContext) async throws -> String {
    let intent = try await registration(named: name).makeIntent(params, appContext)
    return try encode(await donor.donate(intent))
  }

  /// Deletes the donations matching `filter`, and returns the ids of the ones that were deleted.
  internal func deleteDonations(matching filter: AppIntentDonationFilter) async throws -> [String] {
    switch filter {
    case .ids(let ids):
      // Every id is read before anything is deleted, so an unreadable id deletes nothing.
      return try await deleteEach(ids.map { (id: $0, identifier: try decode($0)) })
    case .intent(let name):
      return try await donor.deleteDonations(matching: .intentType(registration(named: name).intentType)).map(encode)
    case .entity(let entity, let id):
      guard let identifier = entities.identifier(for: entity, id: id) else {
        throw UnregisteredDonationEntityException((entity, id))
      }
      return try await donor.deleteDonations(matching: .entity(identifier)).map(encode)
    }
  }

  /// `.donationIdentifiers(_:)` needs iOS 26.4 and its SDK, so each id is deleted on its own. A failed
  /// id does not stop the ids after it, and the exception names which ids were deleted and which not.
  private func deleteEach(_ donations: [(id: String, identifier: IntentDonationIdentifier)]) async throws -> [String] {
    var deleted: [IntentDonationIdentifier] = []
    var failed: [String] = []
    var firstError: (any Error)?
    for donation in donations {
      do {
        deleted += try await donor.deleteDonations(matching: .donation(donation.identifier))
      } catch {
        failed.append(donation.id)
        firstError = firstError ?? error
      }
    }
    let deletedIds = try deleted.map(encode)
    if let firstError {
      throw PartialDonationDeletionException((deleted: deletedIds, failed: failed)).causedBy(firstError)
    }
    return deletedIds
  }

  private func registration(named name: String) throws -> Registration {
    guard let registration = registrations.withLock({ $0[name] }) else {
      throw UnregisteredDonationIntentException(name)
    }
    return registration
  }

  private func encode(_ identifier: IntentDonationIdentifier) throws -> String {
    // `JSONEncoder` only writes valid UTF-8, so there is nothing for a failable conversion to catch.
    // swiftlint:disable:next optional_data_string_conversion
    return String(decoding: try JSONEncoder().encode(identifier), as: UTF8.self)
  }

  private func decode(_ id: String) throws -> IntentDonationIdentifier {
    do {
      return try JSONDecoder().decode(IntentDonationIdentifier.self, from: Data(id.utf8))
    } catch {
      throw InvalidDonationIdentifierException(id)
    }
  }
}

/// The filter `deleteDonationsAsync()` receives. JavaScript types it as a union, so it arrives as one
/// object whose keys say which variant it is.
@Record
internal struct AppIntentDonationFilterRecord {
  var ids: [String]?
  var intent: String?
  var entity: String?
  var id: String?

  func toFilter() throws -> AppIntentDonationFilter {
    switch (ids, intent, entity, id) {
    case (let ids?, nil, nil, nil):
      return .ids(ids)
    case (nil, let intent?, nil, nil):
      return .intent(intent)
    case (nil, nil, let entity?, let id?):
      return .entity(entity, id: id)
    default:
      throw InvalidDonationFilterException()
    }
  }
}

internal final class UnregisteredDonationIntentException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return """
      expo-app-intents has no intent registered for donation as '\(param)'. JavaScript can only name \
      intents that app-target Swift has registered, because only the app target can build them. Make \
      the intent conform to DonatableAppIntent, then add this to the OnCreate of your AppIntentsSetup \
      module: AppIntentDonationRegistry.shared.register("\(param)", as: YourIntent.self)
      """
  }
}

internal final class InvalidDonationIdentifierException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return """
      expo-app-intents could not read the donation id '\(param)', so no donations were deleted. \
      Donation ids are opaque, and one that was changed or built by hand no longer names a donation. \
      Pass the id exactly as donateIntentAsync() or deleteDonationsAsync() returned it.
      """
  }
}

internal final class UnregisteredDonationEntityException: GenericException<(String, String)>, @unchecked Sendable {
  override var reason: String {
    let (entity, id) = param
    return """
      expo-app-intents could not delete donations for the '\(entity)' entity '\(id)'. This happens \
      when no AppEntity is registered as '\(entity)'. It also happens when '\(id)' is not a valid \
      identifier for that entity. Register the entity in the OnCreate of your AppIntentsSetup module with \
      AppEntityIdentifierRegistry.shared.register("\(entity)", as: YourEntity.self), and pass an id \
      that converts to the type of its id property.
      """
  }
}

/// The record's own exception, which names the field, is the cause.
internal final class InvalidDonationParamsException: GenericException<(intent: String, paramsType: String)>,
  @unchecked Sendable
{
  override var reason: String {
    return """
      expo-app-intents could not donate the '\(param.intent)' intent, because the params passed to \
      donateIntentAsync() do not fit its DonationParams record \(param.paramsType). Nothing was \
      donated. Pass every required field of that record, with the type the record declares.
      """
  }
}

/// Keeps the app's error in the reason rather than using `causedBy(_:)`: a cause that is not an
/// `Exception` is described by its `localizedDescription`, which drops the text of a plain Swift error
/// such as a `CustomStringConvertible` struct, and this error comes from app code.
internal final class DonationIntentInitException: GenericException<(intent: String, error: any Error)>,
  @unchecked Sendable
{
  override var reason: String {
    return """
      expo-app-intents could not donate the '\(param.intent)' intent, because its \
      init(donationParams:) threw: \(param.error). Nothing was donated. Check that the params passed \
      to donateIntentAsync() match what init(donationParams:) of the intent registered as \
      '\(param.intent)' expects.
      """
  }
}

/// The first error the system reported is the cause.
internal final class PartialDonationDeletionException: GenericException<(deleted: [String], failed: [String])>,
  @unchecked Sendable
{
  override var reason: String {
    return """
      expo-app-intents could not delete every donation. Deleted: \(list(param.deleted)). Not \
      deleted: \(list(param.failed)). Call deleteDonationsAsync() again with the ids that were not \
      deleted.
      """
  }

  private func list(_ ids: [String]) -> String {
    return ids.isEmpty ? "none" : ids.map { "'\($0)'" }.joined(separator: ", ")
  }
}

internal final class InvalidDonationFilterException: Exception, @unchecked Sendable {
  override var reason: String {
    return """
      deleteDonationsAsync() needs exactly one of { ids }, { intent }, or { entity, id }, so it cannot \
      tell which donations to delete. Pass one of those shapes, and call it once per filter to delete \
      by more than one.
      """
  }
}
