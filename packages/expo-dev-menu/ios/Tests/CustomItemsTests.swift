import Testing

@testable import EXDevMenu

@MainActor
@Suite("Custom dev menu groups")
struct CustomItemsTests {
  @Test
  func `preserves first appearance of groups and item order within each group`() {
    let callbacks = [
      DevMenuManager.Callback(name: "Intro", shouldCollapse: true, icon: "play", group: "Previews"),
      DevMenuManager.Callback(name: "Account", shouldCollapse: false, group: "Account"),
      DevMenuManager.Callback(name: "Card", shouldCollapse: true, group: "Previews"),
      DevMenuManager.Callback(name: "Legacy", shouldCollapse: false),
      DevMenuManager.Callback(name: "Second legacy", shouldCollapse: true)
    ]
    let groups = CustomItems.groups(for: callbacks)

    #expect(groups.map(\.name) == ["Previews", "Account", nil])
    #expect(groups.map { $0.callbacks.map(\.name) } == [
      ["Intro", "Card"], ["Account"], ["Legacy", "Second legacy"]
    ])
    #expect(groups[0].callbacks[0].icon == "play")
    #expect(groups[0].callbacks[0].shouldCollapse)
  }

  @Test
  func `keeps legacy entries together without an icon`() {
    let groups = CustomItems.groups(for: [
      DevMenuManager.Callback(name: "One", shouldCollapse: true),
      DevMenuManager.Callback(name: "Two", shouldCollapse: false)
    ])

    #expect(groups.count == 1)
    #expect(groups[0].name == nil)
    #expect(groups[0].callbacks.map(\.name) == ["One", "Two"])
    #expect(groups[0].callbacks.allSatisfy { $0.icon == nil })
  }

  @Test
  func `empty registrations produce no sections`() {
    #expect(CustomItems.groups(for: []).isEmpty)
  }
}
