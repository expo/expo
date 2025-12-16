import SwiftUI
import Starscream
import Foundation

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

// WebSocket delegate handler class
class WebSocketDelegateHandler: NSObject, WebSocketDelegate {
  var onConnected: (() -> Void)?
  var onDisconnected: ((String, UInt16) -> Void)?
  var onText: ((String) -> Void)?
  var onBinary: ((Data) -> Void)?
  var onError: ((Error?) -> Void)?
  
  func didReceive(event: WebSocketEvent, client: WebSocketClient) {
    switch event {
    case .connected(let headers):
      print("WebSocket connected: \(headers)")
      onConnected?()
    case .disconnected(let reason, let code):
      print("WebSocket disconnected: \(reason) with code: \(code)")
      onDisconnected?(reason, code)
    case .text(let string):
      print("Received text: \(string)")
      onText?(string)
    case .binary(let data):
      print("Received data: \(data.count) bytes")
      onBinary?(data)
    case .ping(_):
      break
    case .pong(_):
      break
    case .viabilityChanged(_):
      break
    case .reconnectSuggested(_):
      break
    case .cancelled:
      print("WebSocket cancelled")
      onDisconnected?("Cancelled", 0)
    case .error(let error):
      if let error = error {
        print("WebSocket error: \(error)")
      }
      onError?(error)
    case .peerClosed:
      print("WebSocket peer closed")
      onDisconnected?("Peer closed", 0)
    }
  }
}

struct DevMenuEchoAI: View {
  @EnvironmentObject var viewModel: DevMenuViewModel
  @State private var inputText: String = ""
  @State private var socket: WebSocket?
  @State private var isConnected: Bool = false
  @State private var delegateHandler = WebSocketDelegateHandler()

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
          HStack() {
              // Context menu button - outside input field, larger size
              Menu {
                Button(action: {
                    self.viewModel.showAIMode = false
                }) {
                  Label("Switch to dev tools", systemImage: "wrench.and.screwdriver")
                }
              } label: {
                Image(systemName: "plus.circle.fill")
                  .font(.system(size: 38))
                  .foregroundColor(.gray)
              }
              .buttonStyle(.plain)

              // Input text field with send button inside
              HStack() {
                  TextField("Generate code...", text: self.$inputText)
                  .textFieldStyle(.plain)

                // Send button - inside input field
                Button(action: {
                    self.sendMessage()
                }) {
                  Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 28))
                    .foregroundColor(.white)
                }
                .buttonStyle(.plain)
              }
              .padding(.trailing, 6)
              .padding(.leading, 16)
              .padding(.vertical, 6)
              .background(Color.expoSecondarySystemBackground)
              .cornerRadius(20)
          }
          .padding(.all, 8)
        }
      }
      .onAppear {
          self.connectWebSocket()
      }
      .onDisappear {
          self.disconnectWebSocket()
      }
    }
  }
  
  private func connectWebSocket() {
    guard let url = URL(string: "ws://localhost:5173/agents/chat/@krystofwoldrich-a1741o7yzk?_pk=\(UUID().uuidString)") else {
      print("Invalid WebSocket URL")
      return
    }
    
    var request = URLRequest(url: url)
    request.timeoutInterval = 5
    
    let newSocket = WebSocket(request: request)
    
    // Set up delegate handler callbacks
    delegateHandler.onConnected = {
      self.isConnected = true

      var payload: [String: Any] = [
        "state": [
          "snackId": "@krystofwoldrich/tqh1io6agfh",
          "authorization": "{\"id\":\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\",\"version\":1,\"expires_at\":xxxxxxxxxxxx}",
          "aiModel": "alibaba/qwen3-coder"
        ],
        "type": "cf_agent_state"
      ]

      guard let jsonData = try? JSONSerialization.data(withJSONObject: payload, options: []),
            let jsonString = String(data: jsonData, encoding: .utf8) else {
        print("Failed to serialize message")
        return
      }

      newSocket.write(string: jsonString)
    }
    
    delegateHandler.onDisconnected = { reason, code in
      self.isConnected = false
    }
    
    delegateHandler.onText = { text in
      // Handle incoming text messages
      // TODO: Parse and update messages
    }
    
    delegateHandler.onError = { error in
      self.isConnected = false
    }
    
    newSocket.delegate = delegateHandler
    self.socket = newSocket
    newSocket.connect()
  }
  
  private func disconnectWebSocket() {
    socket?.disconnect()
    socket = nil
    isConnected = false
  }
  
  private func sendMessage() {
    guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      return
    }
    
    let messageText = inputText
    inputText = ""
    
    // Generate unique request ID
    let requestId = UUID().uuidString
    
    // Create message in the same format as store.ts
    let uiMessage: [String: Any] = [
      "id": "user_\(requestId)",
      "role": "user",
      "parts": [
        [
          "type": "text",
          "text": messageText
        ]
      ]
    ]
    
    let messageBody: [String: Any] = [
      "messages": [uiMessage]
    ]
    
    guard let messageBodyData = try? JSONSerialization.data(withJSONObject: messageBody, options: []),
          let messageBodyString = String(data: messageBodyData, encoding: .utf8) else {
      print("Failed to serialize message body")
      return
    }
    
    let initPayload: [String: Any] = [
      "method": "POST",
      "body": messageBodyString
    ]
    
    var payload: [String: Any] = [
      "id": requestId,
      "type": "cf_agent_use_chat_request",
      "init": initPayload
    ]
    
    // expo_pushNotificationToken is optional, can be nil
    // For now, we'll omit it or set it to empty string
    payload["expo_pushNotificationToken"] = "" as Any
    
    guard let jsonData = try? JSONSerialization.data(withJSONObject: payload, options: []),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
      print("Failed to serialize message")
      return
    }
    
    socket?.write(string: jsonString)
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
              ? Color.white
              : Color.expoSecondarySystemBackground
          )
          .foregroundColor(
            message.role == .user
              ? .black
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
