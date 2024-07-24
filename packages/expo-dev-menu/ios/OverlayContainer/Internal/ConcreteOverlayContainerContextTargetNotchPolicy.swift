//  Copyright (c) 2018, Applidium. All rights reserved
//  ConcreteOverlayContainerContextTargetNotchPolicy.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 28/11/2018.
//

import UIKit

struct ConcreteOverlayContainerContextTargetNotchPolicy: OverlayContainerContextTargetNotchPolicy {
    let isDragging: Bool
    let overlayViewController: UIViewController
    let overlayTranslationHeight: CGFloat
    let velocity: CGPoint
    let notchHeightByIndex: [Int: CGFloat]
    let reachableIndexes: [Int]

    var notchIndexes: Range<Int> {
        0..<notchHeightByIndex.count
    }

    func height(forNotchAt index: Int) -> CGFloat {
        return notchHeightByIndex[index] ?? 0
    }
}
