import ExpoModulesOptimized

// Example usage of @OptimizedFunction macro
@OptimizedFunction
func calculateSum(_ x: Int, _ y: Int) -> Int {
    return x + y
}

@OptimizedFunction
func processData(_ data: String) -> String {
    return data.uppercased()
}

print("\nOriginal calculateSum(10, 20) = \(calculateSum(10, 20))")
print("Original processData(\"hello\") = \(processData("hello"))")
