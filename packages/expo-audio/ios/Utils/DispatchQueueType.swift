//
//  DispatchQueueType.swift
//  SwiftAudio
//
//  Created by David Chavez on 29.05.21.
//

import Foundation

public protocol DispatchQueueType {
    func async(flags: DispatchWorkItemFlags, execute work: @escaping @convention(block) () -> Void)
}

extension DispatchQueue: DispatchQueueType {
    public func async(flags: DispatchWorkItemFlags, execute work: @escaping @convention(block) () -> Void) {
        async(group: nil, qos: .unspecified, flags: flags, execute: work)
    }
}
