//  Copyright (c) 2018, Applidium. All rights reserved
//  ConcreteOverlayContainerContextTransitioning.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 28/11/2018.
//

import UIKit

struct ConcreteOverlayContainerContextTransitioning:
    OverlayContainerContextTransitioning,
    OverlayContainerTransitionCoordinatorContext {

    let isDragging: Bool
    let isCancelled: Bool
    let isAnimated: Bool
    let overlayViewController: UIViewController
    let overlayTranslationHeight: CGFloat
    let velocity: CGPoint
    let targetNotchIndex: Int
    let targetTranslationHeight: CGFloat
    let notchHeightByIndex: [Int: CGFloat]
    let reachableIndexes: [Int]

    var notchIndexes: Range<Int> {
        return 0..<notchHeightByIndex.count
    }

    func height(forNotchAt index: Int) -> CGFloat {
        return notchHeightByIndex[index] ?? 0
    }

    var targetNotchHeight: CGFloat {
        return targetTranslationHeight
    }
}
