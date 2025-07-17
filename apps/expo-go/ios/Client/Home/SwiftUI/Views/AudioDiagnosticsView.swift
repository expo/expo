import SwiftUI
import AVFoundation

struct AudioDiagnosticsView: View {
  @State private var isAudioEnabled = false
  @State private var playsInSilentMode = false
  @State private var allowsRecording = false
  @State private var staysActiveInBackground = false
  @State private var isPlaying = false
  
  private let audioURL = URL(string: "https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02")!
  
  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 24) {
        VStack(alignment: .leading, spacing: 12) {
          Text("Audio Player")
            .font(.headline)
            .fontWeight(.semibold)
          
          AudioPlayerView(
            isAudioEnabled: isAudioEnabled,
            audioURL: audioURL,
            isPlaying: $isPlaying
          )
        }
        
        VStack(alignment: .leading, spacing: 12) {
          Text("Audio Modes")
            .font(.headline)
            .fontWeight(.semibold)
          
          VStack(spacing: 16) {
            AudioOptionToggle(
              title: "Enable Audio",
              value: $isAudioEnabled,
              onChange: { value in
                updateAudioSession()
              }
            )
            
            AudioOptionToggle(
              title: "Play in Silent Mode",
              value: $playsInSilentMode,
              disabled: !isAudioEnabled,
              onChange: { value in
                updateAudioSession()
              }
            )
            
            AudioOptionToggle(
              title: "Allow Recording",
              value: $allowsRecording,
              disabled: !isAudioEnabled,
              onChange: { value in
                updateAudioSession()
              }
            )
            
            AudioOptionToggle(
              title: "Stay Active in Background",
              value: $staysActiveInBackground,
              disabled: !isAudioEnabled || !playsInSilentMode,
              onChange: { value in
                updateAudioSession()
              }
            )
          }
        }
        
        Spacer()
      }
      .padding()
    }
    .navigationTitle("Audio Diagnostics")
    .navigationBarTitleDisplayMode(.inline)
    .onAppear {
      updateAudioSession()
    }
  }
  
  private func updateAudioSession() {
    guard isAudioEnabled else {
      try? AVAudioSession.sharedInstance().setActive(false)
      return
    }
    
    do {
      let session = AVAudioSession.sharedInstance()
      
      var category = AVAudioSession.Category.playback
      var options: AVAudioSession.CategoryOptions = []
      
      if allowsRecording {
        category = .playAndRecord
      }
      
      if !playsInSilentMode {
        options.insert(.mixWithOthers)
      }
      
      try session.setCategory(category, options: options)
      try session.setActive(true)
    } catch {
      print("Audio session error: \(error)")
    }
  }
}

struct AudioPlayerView: View {
  let isAudioEnabled: Bool
  let audioURL: URL
  @Binding var isPlaying: Bool
  
  @State private var player: AVPlayer?
  
  var body: some View {
    VStack(spacing: 16) {
      HStack {
        Button(action: togglePlayback) {
          Image(systemName: isPlaying ? "pause.fill" : "play.fill")
            .font(.title2)
            .foregroundColor(isAudioEnabled ? .blue : .gray)
        }
        .disabled(!isAudioEnabled)
        
        VStack(alignment: .leading) {
          Text("Sample Audio Track")
            .font(.body)
            .fontWeight(.medium)
          
          Text(isPlaying ? "Playing..." : "Ready to play")
            .font(.caption)
            .foregroundColor(.secondary)
        }
        
        Spacer()
      }
      .padding()
      .background(Color(.systemGray6))
      .cornerRadius(8)
    }
    .onAppear {
      setupPlayer()
    }
  }
  
  private func setupPlayer() {
    player = AVPlayer(url: audioURL)
    
    NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: player?.currentItem,
      queue: .main
    ) { _ in
      isPlaying = false
    }
  }
  
  private func togglePlayback() {
    guard let player = player else { return }
    
    if isPlaying {
      player.pause()
      isPlaying = false
    } else {
      player.play()
      isPlaying = true
    }
  }
}

struct AudioOptionToggle: View {
  let title: String
  @Binding var value: Bool
  var disabled: Bool = false
  let onChange: (Bool) -> Void
  
  var body: some View {
    HStack {
      Text(title)
        .font(.body)
        .foregroundColor(disabled ? .secondary : .primary)
      
      Spacer()
      
      Toggle("", isOn: $value)
        .disabled(disabled)
        .onChange(of: value) { newValue in
          onChange(newValue)
        }
    }
    .padding()
    .background(Color(.systemBackground))
    .cornerRadius(8)
    .overlay(
      RoundedRectangle(cornerRadius: 8)
        .stroke(Color(.separator), lineWidth: 0.5)
    )
  }
}

struct AudioDiagnosticsView_Previews: PreviewProvider {
  static var previews: some View {
    NavigationView {
      AudioDiagnosticsView()
    }
  }
}
