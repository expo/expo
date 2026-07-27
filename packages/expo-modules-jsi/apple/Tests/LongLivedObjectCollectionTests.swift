import ExpoModulesJSI
import Testing

@Suite
@JavaScriptActor
struct LongLivedObjectCollectionTests {
  /// Minimal conformer that counts how many times `allowRelease()` was called, so tests can assert
  /// it fires exactly once (and not at all on the remove path).
  final class TrackedObject: LongLivedObject {
    private(set) var releaseCount = 0

    func allowRelease() {
      releaseCount += 1
    }
  }

  // MARK: - add / remove

  @Test
  func `a new collection is empty`() {
    let collection = JavaScriptRuntime().longLivedObjects

    #expect(collection.count == 0)
  }

  @Test
  func `add registers the object`() {
    let collection = JavaScriptRuntime().longLivedObjects

    collection.add(TrackedObject())

    #expect(collection.count == 1)
  }

  @Test
  func `remove deregisters the object`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let object = TrackedObject()

    collection.add(object)
    collection.remove(object)

    #expect(collection.count == 0)
  }

  @Test
  func `remove does not call allowRelease`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let object = TrackedObject()

    collection.add(object)
    collection.remove(object)

    #expect(object.releaseCount == 0)
  }

  @Test
  func `removing an object that was never added is a no-op`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let added = TrackedObject()
    let neverAdded = TrackedObject()

    collection.add(added)
    collection.remove(neverAdded)

    #expect(collection.count == 1)
    #expect(neverAdded.releaseCount == 0)
  }

  @Test
  func `removing one object leaves the others registered`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let first = TrackedObject()
    let second = TrackedObject()

    collection.add(first)
    collection.add(second)
    collection.remove(first)

    #expect(collection.count == 1)
  }

  // MARK: - identity semantics

  @Test
  func `distinct objects are distinct entries`() {
    let collection = JavaScriptRuntime().longLivedObjects

    collection.add(TrackedObject())
    collection.add(TrackedObject())

    #expect(collection.count == 2)
  }

  @Test
  func `adding the same object twice keeps a single entry`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let object = TrackedObject()

    collection.add(object)
    collection.add(object)

    #expect(collection.count == 1)
  }

  @Test
  func `re-adding after remove registers again`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let object = TrackedObject()

    collection.add(object)
    collection.remove(object)
    collection.add(object)

    #expect(collection.count == 1)
  }

  // MARK: - clear

  @Test
  func `clear empties the collection`() {
    let collection = JavaScriptRuntime().longLivedObjects

    collection.add(TrackedObject())
    collection.add(TrackedObject())
    collection.clear()

    #expect(collection.count == 0)
  }

  @Test
  func `clear calls allowRelease exactly once on every survivor`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let first = TrackedObject()
    let second = TrackedObject()

    collection.add(first)
    collection.add(second)
    collection.clear()

    #expect(first.releaseCount == 1)
    #expect(second.releaseCount == 1)
  }

  @Test
  func `clear does not call allowRelease on a removed object`() {
    let collection = JavaScriptRuntime().longLivedObjects
    let removed = TrackedObject()
    let survivor = TrackedObject()

    collection.add(removed)
    collection.add(survivor)
    collection.remove(removed)
    collection.clear()

    #expect(removed.releaseCount == 0)
    #expect(survivor.releaseCount == 1)
  }

  @Test
  func `clear on an empty collection is a no-op`() {
    let collection = JavaScriptRuntime().longLivedObjects

    collection.clear()

    #expect(collection.count == 0)
  }

  @Test
  func `the collection is reusable after clear`() {
    let collection = JavaScriptRuntime().longLivedObjects

    collection.add(TrackedObject())
    collection.clear()
    collection.add(TrackedObject())

    #expect(collection.count == 1)
  }

  // MARK: - ownership

  @Test
  func `the collection stops retaining an object after clear`() {
    let collection = JavaScriptRuntime().longLivedObjects
    weak var weakObject: TrackedObject?

    do {
      let object = TrackedObject()
      weakObject = object
      collection.add(object)
      collection.clear()
    }

    // With no external strong reference and the collection's own reference dropped by `clear()`,
    // the object must have been deallocated.
    #expect(weakObject == nil)
  }

  @Test
  func `the collection stops retaining an object after remove`() {
    let collection = JavaScriptRuntime().longLivedObjects
    weak var weakObject: TrackedObject?

    do {
      let object = TrackedObject()
      weakObject = object
      collection.add(object)
      collection.remove(object)
    }

    #expect(weakObject == nil)
  }

  @Test
  func `the collection retains a registered object`() {
    let collection = JavaScriptRuntime().longLivedObjects
    weak var weakObject: TrackedObject?

    do {
      let object = TrackedObject()
      weakObject = object
      collection.add(object)
    }

    // The external strong reference is gone, but the collection still holds one.
    #expect(weakObject != nil)
  }
}
