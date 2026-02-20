import Combine
import SwiftUI
import expoappbrownfield

struct ContentView: View {
    @State private var listenerId: String?
    @State private var alertMessage: String = ""
    @State private var showAlert: Bool = false
    @State private var messageTimer: Timer?
    @State private var messageCounter = 0
    @State private var stateSubscriptions: [AnyCancellable?] = []
    
    var body: some View {
        NavigationStack {
            NavigationLink(destination: ReactNativeView(moduleName: "main"), label: {
                Text("Open React Native App")
                    .accessibilityIdentifier("openReactNativeButton")
                    .font(.largeTitle)
            })
            NavigationLink(destination: StateView(), label: {
                Text("Open Shared State screen")
                    .accessibilityIdentifier("openStateScreen")
                    .font(.largeTitle)
            })
        }
        .onAppear(perform: onAppear)
        .onDisappear(perform: onDisappear)
        .alert("Message from Native", isPresented: $showAlert) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(alertMessage)
        }
    }
    
    private func onAppear() {
        listenerId = BrownfieldMessaging.addListener { message in
            let sender = message["sender"] as? String ?? "Unknown"
            let nested = message["source"] as? [String: Any?] ?? [:]
            let platform = nested["platform"] as? String ?? "Unknown"
            
            DispatchQueue.main.async {
                self.alertMessage = "\(platform)(\(sender))"
                self.showAlert = true
            }
        }
        
        messageTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { _ in
            sendMessage()
            setTime()
        }
        
        stateSubscriptions.append(
            BrownfieldState.subscribe("number", as: Double.self) { number in
                BrownfieldState.set("number", number * 2)
            }
        )
        stateSubscriptions.append(
            BrownfieldState.subscribe("string", as: String.self) { string in
                BrownfieldState.set("string", string + "po")
            }
        )
        stateSubscriptions.append(
            BrownfieldState.subscribe("boolean", as: Bool.self) { bool in
                BrownfieldState.set("boolean", !bool)
            }
        )
        stateSubscriptions.append(
            BrownfieldState.subscribe("array", as: [Any?].self) { array in
                let additions: [Any?] = [4, 5.6, false, nil, ["test": "test"]]
                BrownfieldState.set("array", array + additions)
            }
        )
        stateSubscriptions.append(
            BrownfieldState.subscribe("object", as: [String: Any?].self) { object in
                var updated = object
                updated["native"] = true
                updated["nested"] = ["key": "value", "nums": [1, 2.3, nil]] as [String: Any]
                BrownfieldState.set("object", updated)
            }
        )
    }
    
    private func onDisappear() {
        if let listenerId = listenerId {
            BrownfieldMessaging.removeListener(id: listenerId)
        }
        messageTimer?.invalidate()
        messageTimer = nil
        stateSubscriptions.forEach { sub in
            sub?.cancel()
        }
    }
    
    private func sendMessage() {
        messageCounter += 1
        
        let nativeMessage: [String: Any] = [
            "source": [
                "platform": "iOS"
            ],
            "counter": messageCounter,
            "timestamp": Int64(Date().timeIntervalSince1970 * 1000),
            "array": ["ab", "c", false, 1, 2.45] as [Any]
        ]
        
        BrownfieldMessaging.sendMessage(nativeMessage)
        print("Sent: \(nativeMessage)")
    }
    
    private func setTime() {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "HH:mm:ss"
        let timeString = formatter.string(from: Date())
        BrownfieldState.set("time", timeString)
    }
}

#Preview {
    ContentView()
}
