import Combine
import SwiftUI
import expoappbrownfield

class BrownfieldTester: ObservableObject {
    @Published var alertMessage: String = ""
    @Published var showAlert: Bool = false
    
    // MARK: - Internal State
    
    private var listenerId: String?
    private var messageTimer: Timer?
    private var messageCounter = 0
    
    // MARK: - Lifecycle Methods
    
    func start() {
        setupListener()
        startTimer()
    }
    
    func stop() {
        if let listenerId = listenerId {
            BrownfieldMessaging.removeListener(id: listenerId)
        }
        messageTimer?.invalidate()
        messageTimer = nil
    }
    
    // MARK: - Private Logic
    
    private func setupListener() {
        listenerId = BrownfieldMessaging.addListener { [weak self] message in
            guard let self = self else { return }
            
            let sender = message["sender"] as? String ?? "Unknown"
            let nested = message["source"] as? [String: Any?] ?? [:]
            let platform = nested["platform"] as? String ?? "Unknown"
            
            DispatchQueue.main.async {
                self.alertMessage = "\(platform)(\(sender))"
                self.showAlert = true
                print(self.alertMessage, self.showAlert)
            }
        }
    }
    
    private func startTimer() {
        messageTimer = Timer.scheduledTimer(withTimeInterval: 2.5, repeats: true) { [weak self] _ in
            self?.sendMessage()
        }
    }
    
    private func sendMessage() {
        messageCounter += 1
        
        let nativeMessage: [String: Any] = [
            "source": ["platform": "iOS"],
            "counter": messageCounter,
            "timestamp": Int64(Date().timeIntervalSince1970 * 1000),
            "array": ["ab", "c", false, 1, 2.45] as [Any]
        ]
        
        BrownfieldMessaging.sendMessage(nativeMessage)
        print("Sent: \(nativeMessage)")
    }
}
