//
//  RemoteCommand.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 20/03/2018.
//

import Foundation
import MediaPlayer


public typealias RemoteCommandHandler = (MPRemoteCommandEvent) -> MPRemoteCommandHandlerStatus

public protocol RemoteCommandProtocol {
    associatedtype Command: MPRemoteCommand
    
    var id: String { get }
    var commandKeyPath: KeyPath<MPRemoteCommandCenter, Command> { get }
    var handlerKeyPath: KeyPath<RemoteCommandController, RemoteCommandHandler> { get }
}

public struct PlayBackCommand: RemoteCommandProtocol {
    
    public static let play = PlayBackCommand(id: "Play", commandKeyPath: \MPRemoteCommandCenter.playCommand, handlerKeyPath: \RemoteCommandController.handlePlayCommand)
    
    public static let pause = PlayBackCommand(id: "Pause", commandKeyPath: \MPRemoteCommandCenter.pauseCommand, handlerKeyPath: \RemoteCommandController.handlePauseCommand)
    
    
    public typealias Command = MPRemoteCommand
    
    public let id: String
    
    public var commandKeyPath: KeyPath<MPRemoteCommandCenter, MPRemoteCommand>
    
    public var handlerKeyPath: KeyPath<RemoteCommandController, RemoteCommandHandler>
    
}

public struct ChangePlaybackPositionCommand: RemoteCommandProtocol {
    
    public static let changePlaybackPosition = ChangePlaybackPositionCommand(id: "ChangePlaybackPosition", commandKeyPath: \MPRemoteCommandCenter.changePlaybackPositionCommand, handlerKeyPath: \RemoteCommandController.handleChangePlaybackPositionCommand)
    
    public typealias Command = MPChangePlaybackPositionCommand
    
    public let id: String
    
    public var commandKeyPath: KeyPath<MPRemoteCommandCenter, MPChangePlaybackPositionCommand>
    
    public var handlerKeyPath: KeyPath<RemoteCommandController, RemoteCommandHandler>
    
}

public struct SkipIntervalCommand: RemoteCommandProtocol {
    
    public typealias Command = MPSkipIntervalCommand
    
    public let id: String
    
    public var commandKeyPath: KeyPath<MPRemoteCommandCenter, MPSkipIntervalCommand>
    
    public var handlerKeyPath: KeyPath<RemoteCommandController, RemoteCommandHandler>
    
    func set(preferredIntervals: [NSNumber]) -> SkipIntervalCommand {
        MPRemoteCommandCenter.shared()[keyPath: commandKeyPath].preferredIntervals = preferredIntervals
        return self
    }
    
}

public struct FeedbackCommand: RemoteCommandProtocol {
    
    public typealias Command = MPFeedbackCommand
    
    public let id: String
    
    public var commandKeyPath: KeyPath<MPRemoteCommandCenter, MPFeedbackCommand>
    
    public var handlerKeyPath: KeyPath<RemoteCommandController, RemoteCommandHandler>
    
    func set(isActive: Bool, localizedTitle: String, localizedShortTitle: String) -> FeedbackCommand {
        MPRemoteCommandCenter.shared()[keyPath: commandKeyPath].isActive = isActive
        MPRemoteCommandCenter.shared()[keyPath: commandKeyPath].localizedTitle = localizedTitle
        MPRemoteCommandCenter.shared()[keyPath: commandKeyPath].localizedShortTitle = localizedShortTitle
        return self
    }
}

public enum RemoteCommand: CustomStringConvertible {

    case play
    
    case pause
    
    
    case changePlaybackPosition
    

    public var description: String {
        switch self {
        case .play: return "play"
        case .pause: return "pause"
        case .changePlaybackPosition: return "changePlaybackPosition"
        }
    }
    
    /**
     All values in an array for convenience.
     Don't use for associated values.
     */
    static func all() -> [RemoteCommand] {
        return [
            .play,
            .pause,
            .changePlaybackPosition,
        ]
    }
    
}
