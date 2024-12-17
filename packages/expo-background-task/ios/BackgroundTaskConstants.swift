// Copyright 2024-present 650 Industries. All rights reserved.
import Foundation

public class BackgroundTaskConstants: NSObject {
  public static let BackgroundWorkerIdentifier = "com.expo.modules.backgroundtask.processing"
  public static let EVENT_PERFORM_WORK = "onPerformWork"
  public static let EVENT_WORK_DONE = "onWorkDone"

  /**
   Startup argument that will cause us to simulate starting from the background
   */
  public static let EXPO_RUN_BACKGROUND_TASK = "EXPO_RUN_BACKGROUND_TASK"
}
