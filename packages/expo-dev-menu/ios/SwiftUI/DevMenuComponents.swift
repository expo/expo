import SwiftUI

/// Submenu listing every component registered with `AppRegistry`.
struct DevMenuComponentsView: View {
  @EnvironmentObject var viewModel: DevMenuViewModel

  var body: some View {
    ScrollView {
      VStack(spacing: 6) {
        ForEach(Array(viewModel.availableAppKeys.enumerated()), id: \.offset) { _, name in
          Button {
            viewModel.switchToComponent(name)
          }
          label: {
            HStack {
              Text(name)
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity, alignment: .leading)
              if name == viewModel.currentAppKey {
                Image(systemName: "checkmark")
                  .foregroundColor(.primary.opacity(0.6))
              }
            }
          }
          .padding()
          .background(Color.expoSecondarySystemBackground)
          .clipShape(RoundedRectangle(cornerRadius: 12))
          .disabled(name == viewModel.currentAppKey)
        }
      }
      .padding()
    }
    .navigationTitle("Components")
    #if os(iOS)
    .navigationBarTitleDisplayMode(.inline)
    #endif
  }
}
