//  Copyright © 2025 650 Industries. All rights reserved.

import SwiftUI
import AVFoundation

struct AudioDiagnosticsView: View {
  @StateObject private var viewModel = AudioDiagnosticsViewModel()

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {
        VStack(alignment: .leading, spacing: 12) {
          Text("Audio Player")
            .font(.headline)
            .fontWeight(.bold)
            .padding(.horizontal)

          AudioPlayerView(viewModel: viewModel)
        }

        VStack(alignment: .leading, spacing: 0) {
          Text("Audio Modes")
            .font(.headline)
            .fontWeight(.bold)
            .padding(.horizontal)
            .padding(.bottom, 8)

          ToggleRow(
            title: "Enable Audio",
            isOn: $viewModel.isAudioEnabled
          )

          ToggleRow(
            title: "Play in Silent Mode",
            isOn: $viewModel.playsInSilentMode,
            isDisabled: !viewModel.isAudioEnabled
          )

          if viewModel.isBackgroundAudioAvailable {
            ToggleRow(
              title: "Continues Playing in Background",
              isOn: $viewModel.staysActiveInBackground,
              isDisabled: !viewModel.isAudioEnabled || !viewModel.playsInSilentMode
            )
          }

          VStack(alignment: .leading, spacing: 8) {
            Text("Interruption Mode")
              .font(.body)
              .padding(.horizontal)
              .padding(.top, 8)

            ForEach(InterruptionMode.allCases, id: \.self) { mode in
              Button {
                if viewModel.isAudioEnabled && (!mode.requiresSilentMode || viewModel.playsInSilentMode) {
                  viewModel.interruptionMode = mode
                }
              } label: {
                HStack {
                  Text(mode.displayName)
                    .foregroundColor(modeButtonColor(for: mode))
                  if viewModel.interruptionMode == mode {
                    Text(" ✓")
                      .foregroundColor(modeButtonColor(for: mode))
                  }
                }
                .padding(.horizontal)
                .padding(.vertical, 8)
                .frame(maxWidth: .infinity, alignment: .leading)
              }
              .disabled(!viewModel.isAudioEnabled || (mode.requiresSilentMode && !viewModel.playsInSilentMode))
            }

            Divider()
          }
        }
      }
      .padding(.vertical)
    }
    .background(Color.expoSystemBackground)
    .navigationTitle("Audio")
    .navigationBarTitleDisplayMode(.inline)
  }

  private func modeButtonColor(for mode: InterruptionMode) -> Color {
    if !viewModel.isAudioEnabled || (mode.requiresSilentMode && !viewModel.playsInSilentMode) {
      return .gray
    }
    return .expoBlue
  }
}

private struct AudioPlayerView: View {
  @ObservedObject var viewModel: AudioDiagnosticsViewModel

  var body: some View {
    VStack(spacing: 12) {
      HStack {
        Button {
          viewModel.togglePlayPause()
        } label: {
          Image(systemName: viewModel.isPlaying ? "pause.circle.fill" : "play.circle.fill")
            .font(.system(size: 44))
            .foregroundColor(viewModel.isAudioEnabled ? .expoBlue : .gray)
        }
        .disabled(!viewModel.isAudioEnabled)

        VStack(alignment: .leading, spacing: 4) {
          Text(viewModel.isPlaying ? "Playing" : "Paused")
            .font(.subheadline)
            .foregroundColor(.primary)

          Text(formatTime(viewModel.currentTime) + " / " + formatTime(viewModel.duration))
            .font(.caption)
            .foregroundColor(.secondary)
        }

        Spacer()
      }
      .padding()
      .background(Color.expoSecondarySystemBackground)
      .clipShape(RoundedRectangle(cornerRadius: 12))

      GeometryReader { geometry in
        ZStack(alignment: .leading) {
          Rectangle()
            .fill(Color.gray.opacity(0.3))
            .frame(height: 4)

          Rectangle()
            .fill(Color.expoBlue)
            .frame(width: geometry.size.width * viewModel.progress, height: 4)
        }
        .clipShape(RoundedRectangle(cornerRadius: 2))
      }
      .frame(height: 4)
    }
    .padding(.horizontal)
  }

  private func formatTime(_ time: Double) -> String {
    let minutes = Int(time) / 60
    let seconds = Int(time) % 60
    return String(format: "%d:%02d", minutes, seconds)
  }
}

private struct ToggleRow: View {
  let title: String
  @Binding var isOn: Bool
  var isDisabled: Bool = false

  var body: some View {
    HStack {
      Text(title)
        .font(.body)
        .foregroundColor(isDisabled ? .gray : .primary)

      Spacer()

      Toggle("", isOn: $isOn)
        .labelsHidden()
        .disabled(isDisabled)
    }
    .padding(.horizontal)
    .padding(.vertical, 8)
    .background(Color.expoSystemBackground)

    Divider()
      .padding(.leading)
  }
}

private enum InterruptionMode: CaseIterable {
  case mixWithOthers
  case doNotMix
  case duckOthers

  var displayName: String {
    switch self {
    case .mixWithOthers:
      return "Mix with Other Apps"
    case .doNotMix:
      return "Do Not Mix"
    case .duckOthers:
      return "Duck Other Apps"
    }
  }

  var requiresSilentMode: Bool {
    return self == .duckOthers
  }

  var avOption: AVAudioSession.CategoryOptions {
    switch self {
    case .mixWithOthers:
      return .mixWithOthers
    case .doNotMix:
      return []
    case .duckOthers:
      return .duckOthers
    }
  }
}

@MainActor
private class AudioDiagnosticsViewModel: ObservableObject {
  @Published var isBackgroundAudioAvailable = false
  @Published var isAudioEnabled = false {
    didSet { updateAudioSession() }
  }
  @Published var playsInSilentMode = false {
    didSet {
      if !playsInSilentMode {
        staysActiveInBackground = false
      }
      updateAudioSession()
    }
  }
  @Published var staysActiveInBackground = false {
    didSet { updateAudioSession() }
  }
  @Published var interruptionMode: InterruptionMode = .mixWithOthers {
    didSet { updateAudioSession() }
  }

  @Published var isPlaying = false
  @Published var currentTime: Double = 0
  @Published var duration: Double = 0
  @Published var progress: Double = 0

  private var player: AVPlayer?
  private var timeObserver: Any?

  private let audioURL = URL(string: "https://p.scdn.co/mp3-preview/f7a8ab9c5768009b65a30e9162555e8f21046f46?cid=162b7dc01f3a4a2ca32ed3cec83d1e02")!

  init() {
    checkBackgroundAudioCapability()
    setupPlayer()
    setupAppStateObserver()
  }

  private func checkBackgroundAudioCapability() {
    if let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] {
      isBackgroundAudioAvailable = backgroundModes.contains("audio")
    }
  }

  private func setupAppStateObserver() {
    NotificationCenter.default.addObserver(
      forName: UIApplication.willResignActiveNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      guard let self else { return }
      Task { @MainActor in
        if self.isPlaying && !self.staysActiveInBackground {
          self.player?.pause()
          self.isPlaying = false
        }
      }
    }
  }

  private func setupPlayer() {
    let playerItem = AVPlayerItem(url: audioURL)
    player = AVPlayer(playerItem: playerItem)

    NotificationCenter.default.addObserver(
      forName: .AVPlayerItemDidPlayToEndTime,
      object: playerItem,
      queue: .main
    ) { [weak self] _ in
      guard let self else { return }
      Task { @MainActor in
        self.isPlaying = false
        self.player?.seek(to: .zero)
        self.currentTime = 0
        self.progress = 0
      }
    }

    let interval = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
      guard let self else { return }
      Task { @MainActor in
        self.currentTime = time.seconds
        if let duration = self.player?.currentItem?.duration.seconds, duration.isFinite {
          self.duration = duration
          self.progress = self.currentTime / duration
        }
      }
    }
  }

  func togglePlayPause() {
    guard isAudioEnabled else { return }

    if isPlaying {
      player?.pause()
      isPlaying = false
    } else {
      player?.play()
      isPlaying = true
    }
  }

  private func updateAudioSession() {
    let session = AVAudioSession.sharedInstance()

    do {
      if !isAudioEnabled {
        try session.setActive(false)
        player?.pause()
        isPlaying = false
        return
      }

      var category: AVAudioSession.Category = .playback
      let options: AVAudioSession.CategoryOptions = interruptionMode.avOption

      if !playsInSilentMode {
        category = .ambient
      }

      try session.setCategory(category, mode: .default, options: options)
      try session.setActive(true)
    } catch {
      print("Failed to configure audio session: \(error)")
    }
  }

  deinit {
    if let timeObserver {
      player?.removeTimeObserver(timeObserver)
    }
  }
}
