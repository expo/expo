import ExpoModulesTestCore
import Testing

@testable import ExpoAudio
@testable import ExpoModulesCore

@Suite("AudioModule", .serialized)
@JavaScriptActor
struct ModuleTests {
  let appContext: AppContext
  let runtime: ExpoRuntime
  let module: AudioModule

  init() throws {
    appContext = TestAppContext()
    runtime = try appContext.runtime
    module = AudioModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
  }

  @Test
  func `setAudioModeAsync plays in silent mode when the mode omits playsInSilentMode`() async throws {
    try await runtime.execute {
      _ = try await runtime.evalAsync("expo.modules.ExpoAudio.setAudioModeAsync({})")
    }

    #expect(module.lastConfiguredMode?.playsInSilentMode == true)
  }

  @Test
  func `setAudioModeAsync keeps the fields that a later call omits`() async throws {
    try await runtime.execute {
      _ = try await runtime.evalAsync(
        "expo.modules.ExpoAudio.setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'duckOthers' })"
      )
      _ = try await runtime.evalAsync("expo.modules.ExpoAudio.setAudioModeAsync({ allowsRecording: true })")
    }

    let mode = try #require(module.lastConfiguredMode)
    #expect(mode.shouldPlayInBackground == true)
    #expect(mode.interruptionMode == .duckOthers)
    #expect(mode.allowsRecording == true)
  }

  @Test
  func `RecordingOptions fills the fields that JavaScript omits`() throws {
    let value = try runtime.eval("({ extension: '.m4a', sampleRate: 44100, numberOfChannels: 2, bitRate: 128000 })")
    let options = try RecordingOptions.decode(value, in: runtime)

    #expect(options.extension == ".m4a")
    #expect(options.sampleRate == 44100)
    #expect(options.audioQuality == 0)
    #expect(options.isMeteringEnabled == false)
    #expect(options.directory == nil)
  }

  @Test
  func `setAudioModeAsync rejects an argument of the wrong type without an error code`() async throws {
    let rejection = try await runtime.execute {
      try await runtime.evalAsync(
        """
        (async () => {
          try {
            await expo.modules.ExpoAudio.setAudioModeAsync(42)
            return 'resolved'
          } catch (error) {
            return `${error.name}:${error.code ?? ''}`
          }
        })()
        """
      ).asString()
    }

    #expect(rejection == "Error:")
  }

  @Test
  func `a player built by the DSL constructor exposes its JS members`() async throws {
    let result = try await runtime.execute {
      try runtime.eval(
        """
        (() => {
          const player = new expo.modules.ExpoAudio.AudioPlayer(null, 500, false, 0, false)
          const status = player.currentStatus
          return [typeof player.id, player.playing, player.volume, status.playbackState, status.mediaServicesDidReset].join(',')
        })()
        """
      ).asString()
    }

    #expect(result == "string,false,1,unknown,false")
  }

  @Test
  func `a playlist reports the loop mode that JavaScript sets`() async throws {
    let result = try await runtime.execute {
      try runtime.eval(
        """
        (() => {
          const playlist = new expo.modules.ExpoAudio.AudioPlaylist([], 500, 'none')
          playlist.loop = 'all'
          return [playlist.loop, playlist.currentStatus.loop].join(',')
        })()
        """
      ).asString()
    }

    #expect(result == "all,all")
  }
}
