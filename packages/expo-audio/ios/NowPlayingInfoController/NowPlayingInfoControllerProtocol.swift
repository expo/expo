//
//  NowPlayingInfoControllerProtocol.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 28/02/2019.
//

import Foundation
import MediaPlayer


public protocol NowPlayingInfoControllerProtocol {
    
    init()
    
    init(infoCenter: NowPlayingInfoCenter)
    
    func set(keyValue: NowPlayingInfoKeyValue)
    
    func set(keyValues: [NowPlayingInfoKeyValue])
    
    func setWithoutUpdate(keyValues: [NowPlayingInfoKeyValue])
    
    func clear()
    
}
