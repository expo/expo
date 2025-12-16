import SwiftUI

struct ChatMessage {
  let id: String
  let role: MessageRole
  let content: String
  let toolCalls: [ToolCall]?
}

enum MessageRole {
  case user
  case assistant
}

struct ToolCall {
  let name: String
  let file: String
}

struct DevMenuEchoAI: View {
  @EnvironmentObject var viewModel: DevMenuViewModel
  @State private var inputText: String = ""

  private var shouldShowEcho: Bool {
    guard let hostUrl = viewModel.appInfo?.hostUrl,
          let url = URL(string: hostUrl),
          let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let queryItems = components.queryItems else {
      return false
    }
    return queryItems.first(where: { $0.name == "project-type" })?.value == "echo"
  }

  // Mock chat messages
  private let mockMessages: [ChatMessage] = [
    ChatMessage(
      id: "1",
      role: .user,
      content: "create a mobile app",
      toolCalls: nil
    ),
    ChatMessage(
      id: "2",
      role: .assistant,
      content: "I'll help you create a mobile app. Let me set up the basic structure with a main screen, a button component, and an entry point.",
      toolCalls: [
        ToolCall(name: "file_edit", file: "index.tsx"),
        ToolCall(name: "file_edit", file: "Button.tsx"),
        ToolCall(name: "file_edit", file: "Screen.tsx")
      ]
    ),
    ChatMessage(
      id: "3",
      role: .user,
      content: "add a navigation bar with a title",
      toolCalls: nil
    ),
    ChatMessage(
      id: "4",
      role: .assistant,
      content: "I'll add a navigation bar with a title to your app. This will include the navigation component and update the main screen to use it.",
      toolCalls: [
        ToolCall(name: "file_edit", file: "NavigationBar.tsx"),
        ToolCall(name: "file_edit", file: "Screen.tsx")
      ]
    ),
    ChatMessage(
      id: "5",
      role: .user,
      content: "make the button red",
      toolCalls: nil
    ),
    ChatMessage(
      id: "6",
      role: .assistant,
      content: "I'll update the button component to use a red color scheme.",
      toolCalls: [
        ToolCall(name: "file_edit", file: "Button.tsx")
      ]
    )
  ]

  var body: some View {
    if viewModel.showAIMode {
      GeometryReader { geometry in
        VStack(spacing: 0) {
          // Chat messages area - takes remaining space
          ScrollView {
            VStack(alignment: .leading, spacing: 16) {
              ForEach(mockMessages, id: \.id) { message in
                ChatMessageView(message: message, maxWidth: geometry.size.width)
              }
            }
            .padding()
          }
          .frame(maxHeight: .infinity)

          // Fixed input at the bottom
          HStack(alignment: .center, spacing: 12) {
              // Context menu button - outside input field, larger size
              Menu {
                Button(action: {
                  viewModel.showAIMode = false
                }) {
                  Label("Switch to dev tools", systemImage: "wrench.and.screwdriver")
                }
              } label: {
                Image(systemName: "plus.circle.fill")
                  .font(.system(size: 28))
                  .foregroundColor(.gray)
              }
              .buttonStyle(.plain)

              // Input text field with send button inside
              HStack(spacing: 12) {
                TextField("Generate code...", text: $inputText)
                  .textFieldStyle(.plain)

                // Send button - inside input field
                Button(action: {}) {
                  Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.white)
                }
                .buttonStyle(.plain)
              }
              .padding(.horizontal)
              .padding(.vertical, 8)
              .background(Color.expoSecondarySystemBackground)
              .cornerRadius(20)
          }
          .padding(.horizontal, 8)
          .padding(.top, 8)
          .padding(.bottom, 8)
        }
      }
    }
  }
}

struct ChatMessageView: View {
  let message: ChatMessage
  let maxWidth: CGFloat

  var body: some View {
    HStack(alignment: .top, spacing: 8) {
      if message.role == .user {
        Spacer(minLength: 40)
      }

      VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 8) {
        Text(message.content)
          .padding(.horizontal, 16)
          .padding(.vertical, 12)
          .background(
            message.role == .user
              ? Color.blue
              : Color.expoSecondarySystemBackground
          )
          .foregroundColor(
            message.role == .user
              ? .white
              : .primary
          )
          .cornerRadius(16)

        if let toolCalls = message.toolCalls, !toolCalls.isEmpty {
          VStack(alignment: .leading, spacing: 4) {
            ForEach(toolCalls, id: \.file) { toolCall in
              HStack(spacing: 8) {
                Image(systemName: "wrench.and.screwdriver.fill")
                  .font(.system(size: 12))
                  .foregroundColor(.secondary)
                Text("\(toolCall.name): \(toolCall.file)")
                  .font(.caption)
                  .foregroundColor(.secondary)
              }
              .padding(.horizontal, 12)
              .padding(.vertical, 6)
              .background(Color.expoSecondarySystemBackground.opacity(0.5))
              .cornerRadius(8)
            }
          }
        }
      }
      .frame(maxWidth: maxWidth * 0.75, alignment: message.role == .user ? .trailing : .leading)

      if message.role == .assistant {
        Spacer(minLength: 40)
      }
    }
  }
}

#Preview {
    DevMenuEchoAI()
}
