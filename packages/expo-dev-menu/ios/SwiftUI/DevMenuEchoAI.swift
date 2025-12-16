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

// Streaming state for processing incoming message chunks
class StreamingState {
  var messages: [ChatMessage] = []
  var currentMessageId: String?
  var currentTextPartId: String?
  var textParts: [String: String] = [:] // text part ID -> accumulated text
  var toolCalls: [String: ToolCallData] = [:] // toolCallId -> tool call data
  var toolInputTextDeltas: [String: String] = [:] // toolCallId -> accumulated input text delta
  
  struct ToolCallData {
    var toolCallId: String
    var toolName: String
    var input: [String: Any]
    var output: String?
    var state: ToolCallState
  }
  
  enum ToolCallState {
    case inputStreaming
    case inputAvailable
    case outputAvailable
  }
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

// Class to hold streaming states (needs to be a class for reference semantics)
class StreamingStateManager {
  var states: [String: StreamingState] = [:]
}

struct DevMenuEchoAI: View {
  @EnvironmentObject var viewModel: DevMenuViewModel
  @State private var inputText: String = ""
  @State private var socket: WebSocket?
  @State private var isConnected: Bool = false
  @State private var delegateHandler = WebSocketDelegateHandler()
  @State private var messages: [ChatMessage] = []
  private let streamingStateManager = StreamingStateManager()

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
              ForEach(messages.isEmpty ? mockMessages : messages, id: \.id) { message in
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
      self.handleIncomingMessage(text)
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
  
  private func handleIncomingMessage(_ text: String) {
    guard let data = text.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
          let type = json["type"] as? String else {
      return
    }
    
    switch type {
    case "cf_agent_state":
      // Handle state updates (can be ignored for now or used for status)
      break
      
    case "cf_agent_chat_messages":
      // Full message list update
      if let messagesArray = json["messages"] as? [[String: Any]] {
        messages = parseMessages(messagesArray)
        // Clear streaming states when we get full message updates
        streamingStateManager.states.removeAll()
      }
      
    case "cf_agent_chat_clear":
      // Clear all messages
      messages = []
      streamingStateManager.states.removeAll()
      
    case "cf_agent_use_chat_response":
      // Streaming chat response
      guard let requestId = json["id"] as? String else { return }
      
      if let bodyString = json["body"] as? String,
         let bodyData = bodyString.data(using: .utf8),
         let chunk = try? JSONSerialization.jsonObject(with: bodyData) as? [String: Any] {
        processStreamChunk(chunk, requestId: requestId)
      }
      
      // Check if stream is done
      if let done = json["done"] as? Bool, done {
        // Clean up streaming state after a delay
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
          self.streamingStateManager.states.removeValue(forKey: requestId)
        }
      }
      
    default:
      break
    }
  }
  
  private func parseMessages(_ messagesArray: [[String: Any]]) -> [ChatMessage] {
    var parsedMessages: [ChatMessage] = []
    
    for msgDict in messagesArray {
      guard let id = msgDict["id"] as? String,
            let roleString = msgDict["role"] as? String,
            let parts = msgDict["parts"] as? [[String: Any]] else {
        continue
      }
      let role: MessageRole = (roleString == "user") ? .user : .assistant
      
      var content = ""
      var toolCalls: [ToolCall]? = nil
      
      for part in parts {
        if let partType = part["type"] as? String {
          if partType == "text", let text = part["text"] as? String {
            content += text
          } else if partType.hasPrefix("tool-") {
            let toolName = String(partType.dropFirst(5))
            if let toolCallId = part["toolCallId"] as? String,
               let input = part["input"] as? [String: Any] {
              // Extract file name from input if available
              let fileName = input["name"] as? String ?? input["file"] as? String ?? "unknown"
              if toolCalls == nil {
                toolCalls = []
              }
              toolCalls?.append(ToolCall(name: toolName, file: fileName))
            }
          }
        }
      }
      
      parsedMessages.append(ChatMessage(
        id: id,
        role: role,
        content: content,
        toolCalls: toolCalls
      ))
    }
    
    return parsedMessages
  }
  
  private func processStreamChunk(_ chunk: [String: Any], requestId: String) {
    guard let chunkType = chunk["type"] as? String else { return }
    
    // Get or initialize streaming state
    var streamState = streamingStateManager.states[requestId]
    if streamState == nil {
      streamState = StreamingState()
      streamState!.messages = messages
      streamingStateManager.states[requestId] = streamState
    }
    let state = streamState!
    
    switch chunkType {
    case "start":
      if let messageId = chunk["messageId"] as? String {
        state.currentMessageId = messageId
        // Create new assistant message if it doesn't exist
        if !state.messages.contains(where: { $0.id == messageId }) {
          state.messages.append(ChatMessage(
            id: messageId,
            role: .assistant,
            content: "",
            toolCalls: nil
          ))
        }
      }
      
    case "start-step":
      // Start of a new step - can be ignored for now
      break
      
    case "text-start":
      if let textId = chunk["id"] as? String {
        state.currentTextPartId = textId
        state.textParts[textId] = ""
      }
      
    case "text-delta":
      if let textId = chunk["id"] as? String,
         let delta = chunk["delta"] as? String {
        let currentText = state.textParts[textId] ?? ""
        state.textParts[textId] = currentText + delta
        
        // Ensure we have a current message ID
        if state.currentMessageId == nil {
          if let lastAssistant = state.messages.last(where: { $0.role == .assistant }) {
            state.currentMessageId = lastAssistant.id
          } else {
            let newMessageId = "assistant_\(Int(Date().timeIntervalSince1970 * 1000))"
            state.currentMessageId = newMessageId
            state.messages.append(ChatMessage(
              id: newMessageId,
              role: .assistant,
              content: "",
              toolCalls: nil
            ))
          }
        }
        
        // Update the message with accumulated text
        if let messageId = state.currentMessageId,
           let messageIndex = state.messages.firstIndex(where: { $0.id == messageId }) {
          let accumulatedText = state.textParts[textId] ?? ""
          let existingMessage = state.messages[messageIndex]
          state.messages[messageIndex] = ChatMessage(
            id: existingMessage.id,
            role: existingMessage.role,
            content: accumulatedText,
            toolCalls: existingMessage.toolCalls
          )
        }
      }
      
    case "text-end":
      if let textId = chunk["id"] as? String {
        state.currentTextPartId = nil
        // Text is finalized, keep it in the message
      }
      
    case "tool-input-start":
      if let toolCallId = chunk["toolCallId"] as? String,
         let toolName = chunk["toolName"] as? String {
        state.toolCalls[toolCallId] = StreamingState.ToolCallData(
          toolCallId: toolCallId,
          toolName: toolName,
          input: [:],
          output: nil,
          state: .inputStreaming
        )
        state.toolInputTextDeltas[toolCallId] = ""
        
        // Ensure we have a current message ID
        if state.currentMessageId == nil {
          if let lastAssistant = state.messages.last(where: { $0.role == .assistant }) {
            state.currentMessageId = lastAssistant.id
          } else {
            let newMessageId = "assistant_\(Int(Date().timeIntervalSince1970 * 1000))"
            state.currentMessageId = newMessageId
            state.messages.append(ChatMessage(
              id: newMessageId,
              role: .assistant,
              content: "",
              toolCalls: nil
            ))
          }
        }
      }
      
    case "tool-input-delta":
      if let toolCallId = chunk["toolCallId"] as? String,
         let inputTextDelta = chunk["inputTextDelta"] as? String {
        let currentDelta = state.toolInputTextDeltas[toolCallId] ?? ""
        let accumulatedDelta = currentDelta + inputTextDelta
        state.toolInputTextDeltas[toolCallId] = accumulatedDelta
        
        // Try to parse the accumulated JSON
        if let deltaData = accumulatedDelta.data(using: .utf8),
           let parsedInput = try? JSONSerialization.jsonObject(with: deltaData) as? [String: Any] {
          if var toolCall = state.toolCalls[toolCallId] {
            toolCall.input = parsedInput
            state.toolCalls[toolCallId] = toolCall
          }
        }
      }
      
    case "tool-input-available":
      if let toolCallId = chunk["toolCallId"] as? String,
         let toolName = chunk["toolName"] as? String,
         let input = chunk["input"] as? [String: Any] {
        if var toolCall = state.toolCalls[toolCallId] {
          toolCall.input = input
          toolCall.state = .inputAvailable
          state.toolCalls[toolCallId] = toolCall
        } else {
          state.toolCalls[toolCallId] = StreamingState.ToolCallData(
            toolCallId: toolCallId,
            toolName: toolName,
            input: input,
            output: nil,
            state: .inputAvailable
          )
        }
        
        // Update message with tool call
        if let messageId = state.currentMessageId,
           let messageIndex = state.messages.firstIndex(where: { $0.id == messageId }) {
          let existingMessage = state.messages[messageIndex]
          var toolCalls: [ToolCall] = existingMessage.toolCalls ?? []
          
          // Extract file name from input
          let fileName = input["name"] as? String ?? input["file"] as? String ?? "unknown"
          if !toolCalls.contains(where: { $0.name == toolName && $0.file == fileName }) {
            toolCalls.append(ToolCall(name: toolName, file: fileName))
          }
          
          state.messages[messageIndex] = ChatMessage(
            id: existingMessage.id,
            role: existingMessage.role,
            content: existingMessage.content,
            toolCalls: toolCalls.isEmpty ? nil : toolCalls
          )
        }
      }
      
    case "tool-output-available":
      if let toolCallId = chunk["toolCallId"] as? String,
         let output = chunk["output"] as? String {
        if var toolCall = state.toolCalls[toolCallId] {
          toolCall.output = output
          toolCall.state = .outputAvailable
          state.toolCalls[toolCallId] = toolCall
        }
      }
      
    case "finish-step", "finish":
      state.currentMessageId = nil
      state.currentTextPartId = nil
      
    default:
      break
    }
    
    // Update the messages state on the main thread
    DispatchQueue.main.async {
      self.messages = state.messages
    }
  }
  
  private func sendMessage() {
    guard !inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      return
    }
    
    let messageText = inputText
    inputText = ""
    
    // Generate unique request ID
    let requestId = UUID().uuidString
    let userId = "user_\(requestId)"
    
    // Add user message to messages immediately
    let userMessage = ChatMessage(
      id: userId,
      role: .user,
      content: messageText,
      toolCalls: nil
    )
    messages.append(userMessage)
    
    // Create message in the same format as store.ts
    let uiMessage: [String: Any] = [
      "id": userId,
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
