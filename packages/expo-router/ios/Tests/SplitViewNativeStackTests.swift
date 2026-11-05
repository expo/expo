import Testing
import UIKit

@testable import ExpoRouter

private final class NativeStackTestDelegate: NSObject, UINavigationControllerDelegate {}

@Suite("SplitView native Stack ownership")
@MainActor
struct SplitViewNativeStackTests {
  @Test
  func keepsScreensNavigationControllerAndItems() throws {
    let navigationClass = try #require(NSClassFromString("RNSNavigationController") as? UINavigationController.Type)
    let navigation = navigationClass.init()
    let delegate = NativeStackTestDelegate()
    navigation.delegate = delegate
    let root = UIViewController()
    navigation.setViewControllers([root], animated: false)
    let column = UIViewController()
    column.addChild(navigation)
    column.view.addSubview(navigation.view)
    navigation.didMove(toParent: column)
    let wrapper = UINavigationController(rootViewController: column)
    let split = UISplitViewController(style: .doubleColumn)
    split.setViewController(UINavigationController(rootViewController: UIViewController()), for: .primary)
    split.setViewController(wrapper, for: .secondary)

    #expect(SplitViewNativeStackIntegration.adopt(column: column, in: split))
    #expect(split.viewController(for: .secondary) === column)
    #expect(column.children.first === navigation)
    #expect(root.navigationController === navigation)
    #expect(navigation.delegate === delegate)
    #expect(navigation.viewControllers.count == 1)
    #expect(navigation.viewControllers.first === root)
    #expect(navigation.navigationBar.topItem === root.navigationItem)
    #expect(wrapper.viewControllers.isEmpty)

    let pushed = UIViewController()
    navigation.pushViewController(pushed, animated: false)
    #expect(pushed.navigationController === navigation)
    #expect(navigation.viewControllers.count == 2)
    #expect(navigation.viewControllers.first === root)
    #expect(navigation.navigationBar.topItem === pushed.navigationItem)
    #expect(navigation.popViewController(animated: false) === pushed)
    #expect(navigation.topViewController === root)
    #expect(navigation.navigationBar.topItem === root.navigationItem)
    #expect(navigation.delegate === delegate)
    #expect(column.children.first === navigation)
    #expect(navigation.parent === column)
  }

  @Test
  func rejectsNavigationControllerAfterAnotherChild() {
    let column = UIViewController()
    column.addChild(UIViewController())
    column.addChild(UINavigationController())
    let wrapper = UINavigationController(rootViewController: column)
    let split = UISplitViewController(style: .doubleColumn)
    split.setViewController(wrapper, for: .secondary)

    #expect(!SplitViewNativeStackIntegration.adopt(column: column, in: split))
    #expect(split.viewController(for: .secondary) === wrapper)
    #expect(wrapper.topViewController === column)
  }

  @Test
  func rejectsNestedStackInsteadOfStealingItsParent() {
    let column = UIViewController()
    let nested = UIViewController()
    column.addChild(nested)
    nested.addChild(UINavigationController())
    let wrapper = UINavigationController(rootViewController: column)
    let split = UISplitViewController(style: .doubleColumn)
    split.setViewController(wrapper, for: .secondary)

    #expect(!SplitViewNativeStackIntegration.adopt(column: column, in: split))
    #expect(nested.parent === column)
    #expect(split.viewController(for: .secondary) === wrapper)
  }

  @Test
  func rejectsColumnWithAnotherChildAfterNavigation() {
    let column = UIViewController()
    let navigation = UINavigationController()
    column.addChild(navigation)
    column.addChild(UIViewController())
    let wrapper = UINavigationController(rootViewController: column)
    let split = UISplitViewController(style: .doubleColumn)
    split.setViewController(wrapper, for: .secondary)

    #expect(!SplitViewNativeStackIntegration.adopt(column: column, in: split))
    #expect(split.viewController(for: .secondary) === wrapper)
    #expect(wrapper.viewControllers == [column])
    #expect(navigation.parent === column)
    #expect(SplitViewNativeStackIntegration.columns.object(forKey: split) == nil)
  }

  @Test
  func rejectsPrimaryColumnWithoutChangingEitherColumn() {
    let primary = UIViewController()
    primary.addChild(UINavigationController())
    let primaryWrapper = UINavigationController(rootViewController: primary)
    let secondary = UIViewController()
    let secondaryWrapper = UINavigationController(rootViewController: secondary)
    let split = UISplitViewController(style: .doubleColumn)
    split.setViewController(primaryWrapper, for: .primary)
    split.setViewController(secondaryWrapper, for: .secondary)

    #expect(!SplitViewNativeStackIntegration.adopt(column: primary, in: split))
    #expect(split.viewController(for: .primary) === primaryWrapper)
    #expect(split.viewController(for: .secondary) === secondaryWrapper)
    #expect(primaryWrapper.viewControllers == [primary])
    #expect(secondaryWrapper.viewControllers == [secondary])
    #expect(SplitViewNativeStackIntegration.columns.object(forKey: split) == nil)
  }

  @Test
  func installedScreensHasRequiredHooks() throws {
    let stack = try #require(NSClassFromString("RNSScreenStackView"))
    let host = try #require(NSClassFromString("RNSSplitHostController"))
    #expect(class_getInstanceMethod(stack, NSSelectorFromString("reactAddControllerToClosestParent:")) != nil)
    #expect(class_getInstanceMethod(host, NSSelectorFromString("splitScreenControllers")) != nil)
    #expect(class_getInstanceMethod(host, NSSelectorFromString("refreshSecondaryNavBar")) != nil)
    #expect(class_getInstanceVariable(host, "_visibleColumns") != nil)
  }
}
