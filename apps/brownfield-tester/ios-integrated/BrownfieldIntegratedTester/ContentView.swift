import SwiftUI
import expoappbrownfield

struct ContentView: View {
    @State private var listenerId: String?
    @State private var alertMessage: String = ""
    @State private var showAlert: Bool = false
    @State private var messageTimer: Timer?
    @State private var messageCounter = 0
    @State private var stateSubscription: StateRemovable?
    
    var body: some View {
        NavigationStack {
            NavigationLink(destination: ReactNativeView(moduleName: "main"), label: {
                Text("Open React Native App")
                    .accessibilityIdentifier("openReactNativeButton")
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
        
        stateSubscription = BrownfieldState.subscribe("counter") { count in
            if let count = count as? Double {
                BrownfieldState.set("counter-duplicated", count * 2)
            }
        }
    }
    
    private func onDisappear() {
        if let listenerId = listenerId {
            BrownfieldMessaging.removeListener(id: listenerId)
        }
        messageTimer?.invalidate()
        messageTimer = nil
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
