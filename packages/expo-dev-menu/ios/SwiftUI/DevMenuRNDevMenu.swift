import SwiftUI

struct DevMenuRNDevMenu: View {
  let onOpenRNDevMenu: () -> Void

  var body: some View {
    Button {
      onOpenRNDevMenu()
    } label: {
      Text("Open React Native dev menu")
        .padding()
        .foregroundColor(.primary)
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    .background(Color.expoSecondarySystemBackground)
    .cornerRadius(18)
  }
}

#Preview {
  DevMenuRNDevMenu {}
}
