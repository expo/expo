import Testing
import UIKit

@testable import ExpoModulesCore

// Mock scene subscriber for testing.
class MockSceneDelegateSubscriber: ExpoSceneDelegateSubscriber {}

@Suite
@MainActor
final class ExpoSceneDelegateSubscriberRepositoryTests {
  @Test
  func `registers a scene subscriber`() {
    let subscriber = MockSceneDelegateSubscriber()
    ExpoAppDelegateSubscriberRepository.registerSceneSubscriber(subscriber)

    #expect(ExpoAppDelegateSubscriberRepository.sceneSubscribers.contains { $0 === subscriber })
  }

  @Test
  func `looks up a scene subscriber by type`() {
    let subscriber = MockSceneDelegateSubscriber()
    ExpoAppDelegateSubscriberRepository.registerSceneSubscriber(subscriber)

    let found = ExpoAppDelegateSubscriberRepository.getSceneSubscriberOfType(MockSceneDelegateSubscriber.self)
    #expect(found === subscriber)
  }
}
