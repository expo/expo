//
//  Benchmark.swift
//  ExpoModulesCore
//
//  Created by Aleksander Mikucki on 28/08/2024.
//

import Foundation

struct FunctionBenchmark: Encodable {
  var jsWrapperExecutionCount = 0
  var bodyExecutionCount = 0
  var bodyExecutionTime = 0.0
  var jsWrapperExecutionTime = 0.0
}

class Benchmark {
  
  var times: [String: FunctionBenchmark] = [:]
  private let internalQueue: DispatchQueue = DispatchQueue(label: "benchmark_queue")
  
  func registerBodyTime(name: String, time: Double) {
    internalQueue.sync {
      if times[name] == nil {
        times[name] = FunctionBenchmark()
      }
      times[name]?.bodyExecutionCount += 1
      times[name]?.bodyExecutionTime += time
    }
  }
  
  func registerWrapperTime(name: String, time: Double) {
    internalQueue.sync {
      if times[name] == nil {
        times[name] = FunctionBenchmark()
      }
      times[name]?.jsWrapperExecutionCount += 1
      times[name]?.jsWrapperExecutionTime += time
    }
  }
  
  func printResults() -> String? {
    let encodedData = times.mapValues {
        [ "jsWrapperExecutionCount": $0.jsWrapperExecutionCount,
          "bodyExecutionCount": $0.bodyExecutionCount,
          "bodyExecutionTime": $0.bodyExecutionCount > 0 ? $0.bodyExecutionTime / Double($0.bodyExecutionCount) : 0,
          "jsWrapperExecutionTime": $0.jsWrapperExecutionCount > 0 ? $0.jsWrapperExecutionTime / Double($0.jsWrapperExecutionCount) : 0]
    }
    guard let jsonData = try? JSONSerialization.data(withJSONObject: encodedData, options: .prettyPrinted) else {
          print("Something is wrong while converting dictionary to JSON data.")
      return nil
       }
    guard let jsonString = String(data: jsonData, encoding: .utf8) else {
          print("Something is wrong while converting JSON data to JSON string.")
          return nil
       }
    UIPasteboard.general.string = jsonString
    times = [:]
    return jsonString
  }
}
