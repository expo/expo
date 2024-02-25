//
//  AnyExpoView.swift
//  ExpoModulesCore
//
//  Created by Dominic Go on 2/26/24.
//

import UIKit
import React

public protocol AnyExpoView: RCTView {

  var appContext: AppContext? { get };

  init(appContext: AppContext?);
};

