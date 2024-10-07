//
//  NowPlayingInfoCenter.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 03/03/2019.
//

import Foundation
import MediaPlayer

public protocol NowPlayingInfoCenter {
    
    var nowPlayingInfo: [String: Any]? { get set }
    
}

extension MPNowPlayingInfoCenter: NowPlayingInfoCenter {}
