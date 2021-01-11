//
//  AnimationImageProvider.swift
//  Lottie_iOS
//
//  Created by Alexandr Goncharov on 07/06/2019.
//

import Foundation

/**
 Text provider is a protocol that is used to supply text to `AnimationView`.
 */
public protocol AnimationTextProvider: AnyObject {
    func textFor(keypathName: String, sourceText: String) -> String
}

/// Text provider that simply map values from dictionary
public final class DictionaryTextProvider: AnimationTextProvider {
    
    public init(_ values: [String: String]) {
        self.values = values
    }
    
    let values: [String: String]
    
    public func textFor(keypathName: String, sourceText: String) -> String {
        return values[keypathName] ?? sourceText
    }
}

/// Default text provider. Uses text in the animation file
public final class DefaultTextProvider: AnimationTextProvider {
    public func textFor(keypathName: String, sourceText: String) -> String {
        return sourceText
    }
    
    public init() {}
}

