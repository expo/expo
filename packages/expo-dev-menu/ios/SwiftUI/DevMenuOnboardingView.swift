import SwiftUI

struct DevMenuOnboardingView: View {
  let onFinish: () -> Void
  @State private var isVisible = true

  var body: some View {
    Rectangle()
      .fill(.ultraThinMaterial)
      .ignoresSafeArea()
      .overlay(onboardingOverlay)
      .offset(x: 0, y: isVisible ? 0.0 : 650.0)
      .animation(.easeInOut(duration: 0.5), value: isVisible)
  }

  private var onboardingOverlay: some View {
    VStack(spacing: 24) {
      VStack(spacing: 16) {
        Text("This is the developer menu. It gives you access to useful tools in your development builds.")
          .frame(maxWidth: .infinity, alignment: .leading)
          .font(.callout)

#if targetEnvironment(simulator)
        VStack(spacing: 4) {
          Text("You can open it at any time with the **⌃ + d** keyboard shortcut.")
            .frame(maxWidth: .infinity, alignment: .leading)
            .font(.callout)

          Text("(Connect Hardware Keyboard must be enabled on your simulator to use this shortcut, you can toggle it with **⌘ + shift + K**.)")
            .foregroundColor(.secondary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .font(.footnote)
        }
#else
        Text("You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.")
          .foregroundColor(.primary)
          .frame(maxWidth: .infinity, alignment: .leading)
#endif
      }

      continueButton
      Spacer()
    }
    .padding()
  }

  private var continueButton: some View {
    Button {
      withAnimation(.easeInOut(duration: 0.3)) {
        isVisible = false
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
        onFinish()
      }
    }
    label: {
      Text("Continue")
        .font(.system(size: 16, weight: .semibold))
        .frame(maxWidth: .infinity)
        .frame(height: 32)
    }
    .buttonStyle(.borderedProminent)
  }
}
