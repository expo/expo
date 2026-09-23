import SwiftUI

struct CustomItems: View {
  let callbacks: [DevMenuManager.Callback]
  let onFireCallback: (String) -> Void

  struct Group {
    let name: String?
    var callbacks: [DevMenuManager.Callback]
  }

  static func groups(for callbacks: [DevMenuManager.Callback]) -> [Group] {
    var groups: [Group] = []
    for callback in callbacks {
      if let index = groups.firstIndex(where: { $0.name == callback.group }) {
        groups[index].callbacks.append(callback)
      } else {
        groups.append(Group(name: callback.group, callbacks: [callback]))
      }
    }
    return groups
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 32) {
      ForEach(Array(Self.groups(for: callbacks).enumerated()), id: \.offset) { _, group in
        VStack(alignment: .leading, spacing: 8) {
          Text((group.name ?? "Custom Menu Items").uppercased())
            .font(.caption)
            .foregroundColor(.primary.opacity(0.6))

          VStack(spacing: 0) {
            ForEach(Array(group.callbacks.enumerated()), id: \.offset) { index, callback in
              if index > 0 {
                Divider()
              }
              DevMenuActionButton(title: callback.name, icon: callback.icon) {
                onFireCallback(callback.name)
              }
            }
          }
          .clipShape(RoundedRectangle(cornerRadius: 18))
        }
      }
    }
  }
}
