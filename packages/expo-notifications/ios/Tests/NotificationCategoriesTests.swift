import ExpoModulesCore
import ExpoModulesTestCore
import Testing
import UserNotifications

@testable import ExpoNotifications

@Suite(.serialized)
@JavaScriptActor
struct NotificationCategoriesTests {
  let appContext: AppContext

  init() {
    appContext = TestAppContext()
    appContext.moduleRegistry.register(moduleType: CategoriesModule.self, name: nil)
  }

  @Test
  func bulkReplacementUpdatesSingleCategoryOperations() async throws {
    let center = UNUserNotificationCenter.current()
    let originalCategories = await center.notificationCategories()
    defer { center.setNotificationCategories(originalCategories) }

    let result = try await appContext.runtime.evalAsync("""
      (async () => {
        const module = expo.modules.ExpoNotificationCategoriesModule;
        const actions = [{ identifier: 'open', buttonTitle: 'Open' }];
        await module.setNotificationCategoriesAsync([]);
        await module.setNotificationCategoryAsync('old', actions);
        await module.setNotificationCategoriesAsync([{ identifier: 'replacement', actions }]);
        await module.setNotificationCategoryAsync('added', actions);
        await module.deleteNotificationCategoryAsync('replacement');
        const categories = await module.getNotificationCategoriesAsync();
        return categories.map(category => category.identifier).sort().join(',');
      })()
      """)

    #expect(try result.asString() == "added")
  }
}
