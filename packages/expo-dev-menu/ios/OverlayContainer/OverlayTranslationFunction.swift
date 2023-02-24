//  Copyright (c) 2018, Applidium. All rights reserved
//  PassThroughView.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 14/11/2018.
//

import UIKit

/// A protocol that provides information about an in-progress translation.
/// Do not adopt this protocol in your own classes. Use the one provided by the `OverlayTranslationFunction`.
public protocol OverlayTranslationParameters {
    /// The mininum translation height
    var minimumHeight: CGFloat { get }
    /// The maximum translation height
    var maximumHeight: CGFloat { get }
    /// The user finger translation
    var translation: CGFloat { get }
}

/// A `OverlayTranslationFunction` defines the relation between the user finger translation
/// and the actual overlay translation.
///
/// Adopt this protocol to tweak the native translation behavior. You can also use the provided
/// implementations like `RubberBandOverlayTranslationFunction`.
public protocol OverlayTranslationFunction {
    /// Returns the expected translation based on the specified parameters.
    func overlayTranslationHeight(using parameters: OverlayTranslationParameters) -> CGFloat
}
