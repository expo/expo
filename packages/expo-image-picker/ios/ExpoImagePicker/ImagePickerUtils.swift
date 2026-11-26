// Copyright 2024-present 650 Industries. All rights reserved.

/**
 Asynchronously maps the given sequence (sequentially).
 */
func asyncMap<ItemsType: Sequence, ResultType>(
  _ items: ItemsType,
  _ transform: (ItemsType.Element) async throws -> ResultType
) async rethrows -> [ResultType] {
  var values = [ResultType]()

  for item in items {
    try await values.append(transform(item))
  }
  return values
}
