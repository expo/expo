//  Copyright (c) 2018, Applidium. All rights reserved
//  ConcreteOverlayContainerDimissingPolicyContext.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 07/04/2020.
//

import UIKit

struct ConcreteOverlayContainerDismissalPolicyContext: OverlayContainerSheetDismissalPolicyContext {

    var isDragging: Bool {
        context.isDragging
    }

    var targetTranslationHeight: CGFloat {
        context.targetTranslationHeight
    }

    var velocity: CGPoint {
        context.velocity
    }

    var overlayTranslationHeight: CGFloat {
        context.overlayTranslationHeight
    }

    var notchIndexes: Range<Int> {
        context.notchIndexes
    }

    var reachableIndexes: [Int] {
        context.reachableIndexes
    }

    func height(forNotchAt index: Int) -> CGFloat {
        context.height(forNotchAt: index)
    }

    let context: OverlayContainerTransitionCoordinatorContext
}
