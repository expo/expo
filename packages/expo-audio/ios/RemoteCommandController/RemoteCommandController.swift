//
//  File.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 20/03/2018.
//

import Foundation
import MediaPlayer

public protocol RemoteCommandable {
    func getCommands() -> [RemoteCommand]
}

public class RemoteCommandController {

    private let center: MPRemoteCommandCenter

    weak var audioPlayer: AudioPlayer?

    var commandTargetPointers: [String: Any] = [:]
    private var enabledCommands: [RemoteCommand] = []

    /**
     Create a new RemoteCommandController.

     - parameter remoteCommandCenter: The MPRemoteCommandCenter used. Default is `MPRemoteCommandCenter.shared()`
     */
    public init(remoteCommandCenter: MPRemoteCommandCenter = MPRemoteCommandCenter.shared()) {
        center = remoteCommandCenter
    }

    internal func enable(commands: [RemoteCommand]) {
        let commandsToDisable = enabledCommands.filter { command in
            !commands.contains(where: { $0.description == command.description })
        }

        enabledCommands = commands
        commands.forEach { self.enable(command: $0) }
        disable(commands: commandsToDisable)

        // Always enable the change playback position command
        enable(command: .changePlaybackPosition)
    }

    internal func disable(commands: [RemoteCommand]) {
        commands.forEach { self.disable(command: $0) }
    }

    private func enableCommand<Command: RemoteCommandProtocol>(_ command: Command) {
        center[keyPath: command.commandKeyPath].isEnabled = true
        center[keyPath: command.commandKeyPath].removeTarget(commandTargetPointers[command.id])
        commandTargetPointers[command.id] = center[keyPath: command.commandKeyPath].addTarget(
            handler: self[keyPath: command.handlerKeyPath])
    }

    private func disableCommand<Command: RemoteCommandProtocol>(_ command: Command) {
        center[keyPath: command.commandKeyPath].isEnabled = false
        center[keyPath: command.commandKeyPath].removeTarget(commandTargetPointers[command.id])
        commandTargetPointers.removeValue(forKey: command.id)
    }

    private func enable(command: RemoteCommand) {
        switch command {
        case .play: self.enableCommand(PlayBackCommand.play)
        case .pause: self.enableCommand(PlayBackCommand.pause)

        case .changePlaybackPosition:
            self.enableCommand(ChangePlaybackPositionCommand.changePlaybackPosition)

        }
    }

    private func disable(command: RemoteCommand) {
        switch command {
        case .play: self.disableCommand(PlayBackCommand.play)
        case .pause: self.disableCommand(PlayBackCommand.pause)
        case .changePlaybackPosition:
            self.disableCommand(ChangePlaybackPositionCommand.changePlaybackPosition)
        }
    }

    // MARK: - Handlers

    public lazy var handlePlayCommand: RemoteCommandHandler = handlePlayCommandDefault
    public lazy var handlePauseCommand: RemoteCommandHandler = handlePauseCommandDefault
    public lazy var handleChangePlaybackPositionCommand: RemoteCommandHandler =
        handleChangePlaybackPositionCommandDefault

    private func handlePlayCommandDefault(event: MPRemoteCommandEvent)
        -> MPRemoteCommandHandlerStatus {
        if let audioPlayer = audioPlayer {
            let rate = audioPlayer.currentRate > 0 ? audioPlayer.currentRate : 1.0
            audioPlayer.play(at: rate)
            return MPRemoteCommandHandlerStatus.success
        }
        return MPRemoteCommandHandlerStatus.commandFailed
    }

    private func handlePauseCommandDefault(event: MPRemoteCommandEvent)
        -> MPRemoteCommandHandlerStatus {
        if let audioPlayer = audioPlayer {

            audioPlayer.ref.pause()
            return MPRemoteCommandHandlerStatus.success
        }
        return MPRemoteCommandHandlerStatus.commandFailed
    }

    private func handleChangePlaybackPositionCommandDefault(event: MPRemoteCommandEvent)
        -> MPRemoteCommandHandlerStatus {
        if let event = event as? MPChangePlaybackPositionCommandEvent,
            let audioPlayer = audioPlayer {

            let seconds = event.positionTime
            audioPlayer.seekTo(seconds)

            return MPRemoteCommandHandlerStatus.success
        }
        return MPRemoteCommandHandlerStatus.commandFailed
    }

}
