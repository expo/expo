//
//  NowPlayingInfoKeyValue.swift
//  SwiftAudio
//
//  Created by Jørgen Henrichsen on 28/02/2019.
//

import Foundation


public protocol NowPlayingInfoKeyValue {
    func getKey() -> String
    func getValue() -> Any?
}
