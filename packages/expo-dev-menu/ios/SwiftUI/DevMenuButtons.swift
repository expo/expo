import SwiftUI

struct DevMenuActionButton: View {
  let title: String
  let icon: String
  let action: () -> Void
  let disabled: Bool

  init(title: String, icon: String, action: @escaping () -> Void, disabled: Bool = false) {
    self.title = title
    self.icon = icon
    self.action = action
    self.disabled = disabled
  }

  var body: some View {
    Button { action() }
    label: {
      HStack {
        Image(systemName: icon)
          .frame(width: 24, height: 24)
          .foregroundColor(disabled ? .secondary : .primary)
          .opacity(0.6)

        Text(title)
          .foregroundColor(disabled ? .secondary : .primary)

        Spacer()
      }
      .padding()
    }
    .disabled(disabled)
    .background(Color.expoSecondarySystemBackground)
    .opacity(disabled ? 0.6 : 1.0)
  }
}

struct DevMenuToggleButton: View {
  let title: String
  let icon: String
  let isEnabled: Bool
  let action: () -> Void
  let disabled: Bool

  init(title: String, icon: String, isEnabled: Bool, action: @escaping () -> Void, disabled: Bool = false) {
    self.title = title
    self.icon = icon
    self.isEnabled = isEnabled
    self.action = action
    self.disabled = disabled
  }

  var body: some View {
    HStack {
      Image(systemName: icon)
        .frame(width: 24, height: 24)
        .foregroundColor(disabled ? .secondary : .primary)
        .opacity(0.6)

      Text(title)
        .foregroundColor(disabled ? .secondary : .primary)

      Spacer()

      Toggle("", isOn: Binding(
        get: { isEnabled && !disabled },
        set: { _ in if !disabled { action() } }
      ))
      .disabled(disabled)
    }
    .padding()
    .background(Color.expoSecondarySystemBackground)
    .opacity(disabled ? 0.6 : 1.0)
  }
}

#Preview {
  DevMenuActionButton(title: "Action", icon: "person.fast") {}
}
