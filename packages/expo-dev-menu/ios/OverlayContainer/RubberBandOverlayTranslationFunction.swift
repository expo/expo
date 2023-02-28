//  Copyright (c) 2018, Applidium. All rights reserved
//  RubberBandOverlayTranslationFunction.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 29/11/2018.
//

import UIKit

/// `RubberBandOverlayTranslationFunction` specifies an overlay that will move linearly between
/// the translation boundaris and limit its progression once reached.
public class RubberBandOverlayTranslationFunction: OverlayTranslationFunction {

    /// A factor defining how much the translation should be limited once one of the boundaries is reached.
    public var factor: CGFloat = 0.5

    public var bouncesAtMaximumHeight = true
    public var bouncesAtMinimumHeight = true

    // MARK: - Life Cycle

    public init() {}

    // MARK: - OverlayTranslationFunction

    public func overlayTranslationHeight(using context: OverlayTranslationParameters) -> CGFloat {
        if context.translation >= context.maximumHeight && bouncesAtMaximumHeight {
            return logarithmicTranslation(translation: context.translation, limit: context.maximumHeight)
        }
        if context.translation <= context.minimumHeight && bouncesAtMinimumHeight {
            let translation = context.minimumHeight + (context.minimumHeight - context.translation)
            let height = logarithmicTranslation(translation: translation, limit: context.minimumHeight)
            return context.minimumHeight - (height - context.minimumHeight)
        }
        return max(context.minimumHeight, min(context.translation, context.maximumHeight))
    }

    // MARK: - Private

    private func logarithmicTranslation(translation: CGFloat, limit: CGFloat) -> CGFloat {
        guard limit > 0 else { return 0 }
        return (limit * (1 + factor * log10(translation / limit))).oc_rounded()
    }
}
