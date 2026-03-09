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
    private var stateListeners: [AnyCancellable?] = []
    
    // MARK: - Lifecycle Methods
    
    func start() {
        setupListener()
        startTimer()
        setupStateListeners()
    }
    
    func stop() {
        if let listenerId = listenerId {
            BrownfieldMessaging.removeListener(id: listenerId)
        }

        messageTimer?.invalidate()
        messageTimer = nil

        stateListeners.forEach { $0?.cancel() }
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
            self?.setTime()
        }
    }
    
    private func setupStateListeners() {
        stateListeners.append(contentsOf: [
            BrownfieldState.subscribe("number") { number in
                if let cast = number as? Double {
                    print(cast)
                }
            },
            BrownfieldState.subscribe("string") { string in
                if let cast = string as? String {
                    print(cast)
                }
            },
            BrownfieldState.subscribe("boolean") { bool in
                if let cast = bool as? Bool {
                    print(cast)
                }
            },
            BrownfieldState.subscribe("array") { array in
                if let cast = array as? [Any?] {
                    print(cast)
                }
            },
            BrownfieldState.subscribe("object") { obj in
                if let cast = obj as? [String: Any?] {
                    print(cast)
                }
            },
        ])
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
    
    private func setTime() {
       let formatter = DateFormatter()
       formatter.locale = Locale(identifier: "en_US_POSIX")
       formatter.dateFormat = "HH:mm:ss"
       let timeString = formatter.string(from: Date())
       BrownfieldState.set("time", timeString)
   }
}
