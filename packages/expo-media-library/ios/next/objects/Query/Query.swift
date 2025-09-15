import Photos
import ExpoModulesCore

class Query: SharedObject {
  private var predicates: [NSPredicate] = []
  private var sortDescriptors: [NSSortDescriptor] = []
  private var album: Album?
  private var limit: Int?
  private var offset: Int?

  func eq(_ assetField: AssetField, _ value: Either<MediaTypeNext, Int>) throws -> Query {
    let predicate = try AssetFieldPredicateBuilder.buildPredicate(
      assetField: assetField,
      value: value,
      symbol: "="
    )
    predicates.append(predicate)
    return self
  }

  func within(_ assetField: AssetField, _ values: Either<[MediaTypeNext], [Int]>) throws -> Query {
    let predicate = try AssetFieldPredicateBuilder.buildPredicate(
      assetField: assetField,
      values: values,
      symbol: "IN"
    )
    predicates.append(predicate)
    return self
  }

  func gt(_ assetField: AssetField, _ value: Int) -> Query {
    let predicate = AssetFieldPredicateBuilder.buildPredicate(
      assetField: assetField,
      value: value,
      symbol: ">"
    )
    predicates.append(predicate)
    return self
  }

  func gte(_ assetField: AssetField, _ value: Int) -> Query {
    let predicate = AssetFieldPredicateBuilder.buildPredicate(
      assetField: assetField,
      value: value,
      symbol: ">="
    )
    predicates.append(predicate)
    return self
  }

  func lt(_ assetField: AssetField, _ value: Int) -> Query {
    let predicate = AssetFieldPredicateBuilder.buildPredicate(
      assetField: assetField,
      value: value,
      symbol: "<"
    )
    predicates.append(predicate)
    return self
  }

  func lte(_ assetField: AssetField, _ value: Int) -> Query {
    let predicate = AssetFieldPredicateBuilder.buildPredicate(
      assetField: assetField,
      value: value,
      symbol: "<="
    )
    predicates.append(predicate)
    return self
  }

  func limit(_ limit: Int) -> Query {
    self.limit = limit
    return self
  }

  func offset(_ offset: Int) -> Query {
    self.offset = offset
    return self
  }

  func album(_ album: Album) -> Query {
    self.album = album
    return self
  }

  func orderBy(sortDescriptor: SortDescriptor) -> Query {
    sortDescriptors.append(sortDescriptor.toNSSortDescriptor())
    return self
  }

  func exe() async throws -> [Asset] {
    let fetchOptions = constructFetchOptions()
    let phFetchResult = try await fetch(fetchOptions)
    let phAssets = getExactNumberOfPHAssets(
      from: phFetchResult,
      fetchLimit: fetchOptions.fetchLimit
    )
    return phAssets.map { Asset(id: $0.localIdentifier) }
  }

  private func constructFetchOptions() -> PHFetchOptions {
    let fetchOptions = PHFetchOptions()
    fetchOptions.sortDescriptors = sortDescriptors
    fetchOptions.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
    if let limit {
      fetchOptions.fetchLimit = limit + (offset ?? 0)
    }
    return fetchOptions
  }

  private func fetch(_ fetchOptions: PHFetchOptions) async throws -> PHFetchResult<PHAsset> {
    if let album {
      let collection = try await album.getCollection()
      return PHAsset.fetchAssets(in: collection, options: fetchOptions)
    }
    return PHAsset.fetchAssets(with: fetchOptions)
  }

  private func getExactNumberOfPHAssets(
    from phFetchResult: PHFetchResult<PHAsset>,
    fetchLimit: Int?
  ) -> [PHAsset] {
    let start = offset ?? 0
    let end: Int
    if let fetchLimit {
      end = min(start + fetchLimit - 1, phFetchResult.count - 1)
    } else {
      end = phFetchResult.count - 1
    }
    guard start <= end else {
      return []
    }
    return phFetchResult.objects(at: IndexSet(integersIn: start...end))
  }
}
