import SwiftUI

struct CardStyle: ViewModifier {
  func body(content: Content) -> some View {
    content
      .background(Color("backgroundDefault"))
      .clipShape(RoundedRectangle(cornerRadius: 8))
      .overlay(
        RoundedRectangle(cornerRadius: 8)
          .stroke(Color(.systemGray4), lineWidth: 0.8)
      )
  }
}

extension View {
  func cardStyle() -> some View {
    modifier(CardStyle())
  }
}