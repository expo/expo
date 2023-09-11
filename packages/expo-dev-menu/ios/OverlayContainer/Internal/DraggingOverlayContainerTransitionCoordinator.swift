//  Copyright (c) 2018, Applidium. All rights reserved
//  InterruptibleAnimatorOverlayContainerTransitionCoordinator.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 28/11/2018.
//

import UIKit

private typealias Completion = (OverlayContainerTransitionCoordinatorContext) -> Void

class DraggingOverlayContainerTransitionCoordinator: OverlayContainerTransitionCoordinator {

    private let context: OverlayContainerTransitionCoordinatorContext

    private var completions: [Completion] = []

    // MARK: - Life Cycle

    init(context: OverlayContainerTransitionCoordinatorContext) {
        self.context = context
    }

    // MARK: - Public

    func performCompletions(with context: OverlayContainerTransitionCoordinatorContext) {
        completions.forEach { $0(context) }
        completions = []
    }

    // MARK: - OverlayContainerTransitionCoordinatorContext

    var isDragging: Bool {
        return context.isDragging
    }

    var velocity: CGPoint {
        return context.velocity
    }

    var isCancelled: Bool {
        return context.isCancelled
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
        animation?(context)
        completion.flatMap { completions.append($0) }
    }
}
