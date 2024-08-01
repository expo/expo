//  Copyright (c) 2018, Applidium. All rights reserved
//  UIPanGesture+Utils.swift
//  Pods
//
//  Created by Gaétan Zanella on 28/11/2018.
//

import UIKit

extension UIPanGestureRecognizer {

    enum VerticalDirection {
        case up
        case down
        case none
    }

    var yDirection: VerticalDirection {
        let yVelocity = velocity(in: nil).y
        if yVelocity == 0 {
            return .none
        }
        if yVelocity < 0 {
            return .up
        }
        return .down
    }
}
