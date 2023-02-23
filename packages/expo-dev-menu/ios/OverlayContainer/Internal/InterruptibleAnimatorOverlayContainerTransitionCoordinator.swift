//  Copyright (c) 2018, Applidium. All rights reserved
//  InterruptibleAnimatorOverlayContainerTransitionCoordinator.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 28/11/2018.
//

import UIKit

class InterruptibleAnimatorOverlayContainerTransitionCoordinator: OverlayContainerTransitionCoordinator {

    private let animator: UIViewImplicitlyAnimating
    private let context: OverlayContainerTransitionCoordinatorContext

    // MARK: - Life Cycle

    init(animator: UIViewImplicitlyAnimating, context: OverlayContainerTransitionCoordinatorContext) {
        self.animator = animator
        self.context = context
    }

    // MARK: - Public

    func markAsCancelled() {
        isCancelled = true
    }

    // MARK: - OverlayContainerTransitionCoordinatorContext

    private(set) var isCancelled = false

    var isDragging: Bool {
        return context.isDragging
    }

    var velocity: CGPoint {
        return context.velocity
    }

    var isAnimated: Bool {
        return context.isAnimated
    }

    var targetTranslationHeight: CGFloat {
        return context.targetTranslationHeight
    }

    var overlayTranslationHeight: CGFloat {
        return context.overlayTranslationHeight
    }

    var notchIndexes: Range<Int> {
        return context.notchIndexes
    }

    var reachableIndexes: [Int] {
        return context.reachableIndexes
    }

    func height(forNotchAt index: Int) -> CGFloat {
        return context.height(forNotchAt: index)
    }

    // MARK: - OverlayContainerTransitionCoordinator

    func animate(alongsideTransition animation: ((OverlayContainerTransitionCoordinatorContext) -> Void)?,
                 completion: ((OverlayContainerTransitionCoordinatorContext) -> Void)?) {
        animator.addAnimations? { [weak self] in
            self.flatMap { animation?($0) }
        }
        animator.addCompletion? { [weak self] _ in
            self.flatMap { completion?($0) }
        }
    }
}
