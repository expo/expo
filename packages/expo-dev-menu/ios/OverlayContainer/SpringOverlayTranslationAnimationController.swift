//  Copyright (c) 2018, Applidium. All rights reserved
//  SpringOverlayTranslationAnimationController.swift
//  OverlayContainer
//
//  Created by Gaétan Zanella on 21/11/2018.
//

import UIKit

private struct Constant {
    static let defaultMass: CGFloat = 1
    static let defaultDamping: CGFloat = 0.7
    static let defaultRigidDamping: CGFloat = 0.9
    static let defaultResponse: CGFloat = 0.3
    static let minimumDamping: CGFloat = 1
    static let minimumVelocityConsideration: CGFloat = 150
    static let maximumVelocityConsideration: CGFloat = 3000
}

/// An `OverlayAnimatedTransitioning` implementation based on `UISpringTimingParameters`.
public class SpringOverlayTranslationAnimationController: OverlayAnimatedTransitioning {

    public var mass: CGFloat = Constant.defaultMass
    public var damping: CGFloat = Constant.defaultDamping
    public var response: CGFloat = Constant.defaultResponse

    // MARK: - Life Cycle

    public init() {}

    public init(style: OverlayContainerViewController.OverlayStyle) {
        switch style {
        case .expandableHeight, .rigid:
            // (gz) 2019-06-15 We also nullify the damping value when using rigid styles
            // to avoid the panel to be lifted above the bottom of the screen.
            damping = Constant.defaultRigidDamping
        case .flexibleHeight:
            damping = Constant.defaultDamping
        }
    }

    // MARK: - OverlayAnimatedTransitioning

    public func interruptibleAnimator(using context: OverlayContainerContextTransitioning) -> UIViewImplicitlyAnimating {
        let velocity = min(
            Constant.maximumVelocityConsideration,
            max(abs(context.velocity.y), Constant.minimumVelocityConsideration)
        )
        let velocityRange = Constant.maximumVelocityConsideration - Constant.minimumVelocityConsideration
        let normalizedVelocity = (velocity - Constant.minimumVelocityConsideration) / velocityRange
        let normalizedDamping = normalizedVelocity * (damping - Constant.minimumDamping) + Constant.minimumDamping
        let timing = UISpringTimingParameters(
            damping: normalizedDamping,
            response: response,
            mass: mass
        )
        return UIViewPropertyAnimator(
            duration: 0, // duration is ignored when using `UISpringTimingParameters.init(mass:stiffness:damping:initialVelocity)`
            timingParameters: timing
        )
    }
}

extension UISpringTimingParameters {
    convenience init(damping: CGFloat, response: CGFloat, mass: CGFloat) {
        let stiffness = pow(2 * .pi / response, 2)
        let damp = 4 * .pi * damping / response
        self.init(mass: mass, stiffness: stiffness, damping: damp, initialVelocity: .zero)
    }
}
