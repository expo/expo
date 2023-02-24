//  Copyright (c) 2018, Applidium. All rights reserved
//  HeightConstraintOverlayTranslationController.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 29/11/2018.
//

import UIKit

typealias TranslationCompletionBlock = () -> Void

enum TranslationType {
    case toIndex(Int), basedOnTargetPolicy, toLastReachedNotchIndex
}

private struct TranslationMetaData {
    let isAnimated: Bool
    let velocity: CGPoint
    let type: TranslationType
}

protocol HeightConstraintOverlayTranslationControllerDelegate: AnyObject {
    func overlayViewController(for translationController: OverlayTranslationController) -> UIViewController?

    func translationController(_ translationController: OverlayTranslationController,
                               willMoveOverlayToNotchAt index: Int)
    func translationController(_ translationController: OverlayTranslationController,
                               didMoveOverlayToNotchAt index: Int)

    func translationControllerWillStartDraggingOverlay(_ translationController: OverlayTranslationController)
    func translationController(_ translationController: OverlayTranslationController,
                               willEndDraggingAtVelocity velocity: CGPoint)
    func translationController(_ translationController: OverlayTranslationController,
                               willTranslateOverlayWith transitionCoordinator: OverlayContainerTransitionCoordinator)

    func translationControllerDidScheduleTranslations(_ translationController: OverlayTranslationController)
}

class HeightConstraintOverlayTranslationController: OverlayTranslationController {

    weak var delegate: HeightConstraintOverlayTranslationControllerDelegate?


    private var overlayViewController: UIViewController? {
        return delegate?.overlayViewController(for: self)
    }

    private var lastScheduledTranslationAnimator: UIViewImplicitlyAnimating?

    private var translationEndNotchIndex = 0
    private var deferredTranslation: TranslationMetaData?
    private var deferredTranslationCompletionBlocks: [TranslationCompletionBlock] = []

    private var translationStartHeight: CGFloat = 0.0
    private var translationEndNotchHeight: CGFloat {
        return configuration.heightForNotch(at: translationEndNotchIndex)
    }

    private let configuration: OverlayContainerConfiguration
    private let translationHeightConstraint: NSLayoutConstraint
    private var isDragging = false

    // MARK: - Life Cycle

    init(translationHeightConstraint: NSLayoutConstraint,
         configuration: OverlayContainerConfiguration) {
        self.translationHeightConstraint = translationHeightConstraint
        self.configuration = configuration
    }

    // MARK: - Public

    func hasPendingTranslation() -> Bool {
        return deferredTranslation != nil
    }

    func performDeferredTranslations() {
        guard let overlay = delegate?.overlayViewController(for: self),
            let deferredTranslation = deferredTranslation else {
                return
        }
        let completions = deferredTranslationCompletionBlocks
        self.deferredTranslation = nil
        self.deferredTranslationCompletionBlocks = []
        let targetIndex: Int
        switch deferredTranslation.type {
        case .basedOnTargetPolicy:
            let context = ConcreteOverlayContainerContextTargetNotchPolicy(
                isDragging: false,
                overlayViewController: overlay,
                overlayTranslationHeight: translationHeight,
                velocity: deferredTranslation.velocity,
                notchHeightByIndex: configuration.notchHeightByIndex,
                reachableIndexes: enabledNotchIndexes()
            )
            let policy = configuration.overlayTargetNotchPolicy(forOverlay: overlay)
            targetIndex = policy.targetNotchIndex(using: context)
        case let .toIndex(index):
            targetIndex = index
        case .toLastReachedNotchIndex:
            targetIndex = lastTranslationEndNotchIndex
        }
        delegate?.translationController(self, willMoveOverlayToNotchAt: targetIndex)
        let velocity = deferredTranslation.velocity
        let isAnimated = deferredTranslation.isAnimated
        translationEndNotchIndex = targetIndex
        let targetHeight = configuration.heightForNotch(at: translationEndNotchIndex)
        if isAnimated {
            let height = translationHeight
            let context = ConcreteOverlayContainerContextTransitioning(
                isDragging: false,
                isCancelled: false,
                isAnimated: true,
                overlayViewController: overlay,
                overlayTranslationHeight: height,
                velocity: velocity,
                targetNotchIndex: translationEndNotchIndex,
                targetTranslationHeight: targetHeight,
                notchHeightByIndex: configuration.notchHeightByIndex,
                reachableIndexes: enabledNotchIndexes()
            )
            let animationController = configuration.animationController(forOverlay: overlay)
            let animator = animationController.interruptibleAnimator(using: context)
            let coordinator = InterruptibleAnimatorOverlayContainerTransitionCoordinator(
                animator: animator,
                context: context
            )
            animator.addCompletion?({ [weak self] _ in
                guard let self = self else { return }
                if self.lastScheduledTranslationAnimator === animator {
                    self.delegate?.translationController(self, didMoveOverlayToNotchAt: targetIndex)
                    self.lastScheduledTranslationAnimator = nil
                } else {
                    coordinator.markAsCancelled()
                }
                completions.forEach { $0() }
            })
            delegate?.translationController(self, willTranslateOverlayWith: coordinator)
            updateConstraint(toHeight: targetHeight)
            animator.startAnimation()
            lastScheduledTranslationAnimator = animator
        } else {
            translateOverlayWithoutAnimation(toHeight: targetHeight, isDragging: false)
            completions.forEach { $0() }
            delegate?.translationController(self, didMoveOverlayToNotchAt: targetIndex)
        }
    }

    func scheduleOverlayTranslation(_ translationType: TranslationType,
                                    velocity: CGPoint,
                                    animated: Bool,
                                    completion: (() -> Void)? = nil) {
        deferredTranslation = TranslationMetaData(
            isAnimated: animated,
            velocity: velocity,
            type: translationType
        )
        completion.flatMap { deferredTranslationCompletionBlocks.append($0) }
    }

    // MARK: - OverlayTranslationController

    // Accessors

    var lastTranslationEndNotchIndex: Int {
        return translationEndNotchIndex
    }

    var translationHeight: CGFloat {
        return translationHeightConstraint.constant
    }

    var translationPosition: OverlayTranslationPosition {
        let isAtTop = translationHeight == maximumReachableNotchHeight()
        let isAtBottom = translationHeight == minimumReachableNotchHeight()
        if isAtTop && isAtBottom {
            return .stationary
        }
        if isAtTop {
            return .top
        } else if isAtBottom {
            return .bottom
        } else {
            return .inFlight
        }
    }

    func isDraggable(at point: CGPoint, in coordinateSpace: UICoordinateSpace) -> Bool {
        guard let overlay = overlayViewController else { return false }
        return configuration.shouldStartDraggingOverlay(
            overlay,
            at: point,
            in: coordinateSpace
        )
    }

    func overlayHasReachedANotch() -> Bool {
        return enabledNotchIndexes().contains {
            configuration.heightForNotch(at: $0) == translationHeight
        }
    }

    func startOverlayTranslation() {
        isDragging = false
        translationStartHeight = translationHeight
    }

    func dragOverlay(withOffset offset: CGFloat, usesFunction: Bool) {
        guard let viewController = overlayViewController else { return }
        let maximumHeight = maximumReachableNotchHeight()
        let minimumHeight = minimumReachableNotchHeight()
        let translation = translationStartHeight - offset
        let height: CGFloat
        if usesFunction {
            let parameters = ConcreteOverlayTranslationParameters(
                minimumHeight: minimumHeight,
                maximumHeight: maximumHeight,
                translation: translation
            )
            let function = configuration.overlayTranslationFunction(using: parameters, for: viewController)
            height = function.overlayTranslationHeight(using: parameters)
        } else {
            height = max(minimumHeight, min(maximumHeight, translation))
        }
        if height != translationHeightConstraint.constant, !isDragging {
            delegate?.translationControllerWillStartDraggingOverlay(self)
            isDragging = true
        }
        translateOverlayWithoutAnimation(toHeight: max(height, 0), isDragging: true)
    }

    func endOverlayTranslation(withVelocity velocity: CGPoint) {
        if isDragging {
            delegate?.translationController(self, willEndDraggingAtVelocity: velocity)
        }
        guard overlayHasAmibiguousTranslationHeight() else { return }
        scheduleOverlayTranslation(.basedOnTargetPolicy, velocity: velocity, animated: true)
        delegate?.translationControllerDidScheduleTranslations(self)
    }

    // MARK: - Private

    private func overlayHasAmibiguousTranslationHeight() -> Bool {
        let heights = enabledNotchIndexes().map { configuration.heightForNotch(at: $0) }
        guard let index = heights.firstIndex(where: { $0 == translationHeight }) else {
            return true
        }
        return configuration.heightForNotch(at: index) != translationEndNotchHeight
    }

    private func translateOverlayWithoutAnimation(toHeight height: CGFloat, isDragging: Bool) {
        guard let overlay = overlayViewController else { return }
        let context = ConcreteOverlayContainerContextTransitioning(
            isDragging: isDragging,
            isCancelled: false,
            isAnimated: false,
            overlayViewController: overlay,
            overlayTranslationHeight: height,
            velocity: .zero,
            targetNotchIndex: 0,
            targetTranslationHeight: height,
            notchHeightByIndex: configuration.notchHeightByIndex,
            reachableIndexes: enabledNotchIndexes()
        )
        let coordinator = DraggingOverlayContainerTransitionCoordinator(context: context)
        updateConstraint(toHeight: height)
        delegate?.translationController(self, willTranslateOverlayWith: coordinator)
        coordinator.performCompletions(with: context)
    }

    private func updateConstraint(toHeight height: CGFloat) {
        guard translationHeightConstraint.constant != height else { return }
        translationHeightConstraint.constant = height
    }

    private func enabledNotchIndexes() -> [Int] {
        guard let controller = overlayViewController else { return [] }
        return configuration.enabledNotchIndexes(for: controller)
    }

    private func minimumReachableNotchHeight() -> CGFloat {
        let minimum = enabledNotchIndexes().first.flatMap {
            configuration.heightForNotch(at: $0)
        } ?? configuration.maximumNotchHeight
        // (gz) 2019-04-11 If the overlay is still at a disabled notch
        return min(translationEndNotchHeight, minimum)
    }

    private func maximumReachableNotchHeight() -> CGFloat {
        let maximum = enabledNotchIndexes().last.flatMap {
            configuration.heightForNotch(at: $0)
        } ?? configuration.maximumNotchHeight
        // (gz) 2019-04-11 If the overlay is still at a disabled notch
        return max(translationEndNotchHeight, maximum)
    }
}
