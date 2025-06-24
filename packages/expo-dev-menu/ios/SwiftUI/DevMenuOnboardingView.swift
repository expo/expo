import SwiftUI

struct DevMenuOnboardingView: View {
  let onFinish: () -> Void
  @State private var isVisible = true

  var body: some View {
    if isVisible {
      Color.white
        .ignoresSafeArea()
        .overlay(onboardingOverlay)
        .opacity(isVisible ? 1.0 : 0.0)
        .animation(.easeInOut(duration: 0.3), value: isVisible)
    }
  }

  private var onboardingOverlay: some View {
    VStack(spacing: 24) {
      VStack(spacing: 16) {
        Text("This is the developer menu. It gives you access to useful tools in your development builds.")
          .font(.body)
          .multilineTextAlignment(.leading)

#if targetEnvironment(simulator)
        VStack(alignment: .leading, spacing: 8) {
          Text("You can open it at any time with the **⌃ + d** keyboard shortcut.")
            .font(.body)

          Text("(Connect Hardware Keyboard must be enabled on your simulator to use this shortcut, you can toggle it with **⌘ + shift + K**.)")
            .font(.caption)
            .foregroundColor(.secondary)
        }
#else
        Text("You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.")
          .font(.body)
#endif
      }
      .foregroundColor(.white)

      continueButton
    }
    .padding(32)
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
        .font(.headline)
        .foregroundColor(.white)
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.blue)
        .cornerRadius(12)
    }
  }
}
