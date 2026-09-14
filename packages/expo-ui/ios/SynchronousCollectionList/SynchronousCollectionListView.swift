// Copyright 2026-present 650 Industries, Inc.
import ExpoModulesCore
import UIKit

final class SynchronousCollectionListView: ExpoView {
  var rendererId = ""
  var itemCount = 0
  var revision = 0
  private var collection: SynchronousCollectionView?

  func updateProps() {
    guard let presenter = appContext?.reactSurfacePresenter else { return }
    let collection: SynchronousCollectionView
    if let existing = self.collection {
      collection = existing
    } else {
      collection = SynchronousCollectionView(pool: ExpoUISynchronousCollectionRootPool(presenter: presenter))
      collection.frame = bounds
      collection.autoresizingMask = [.flexibleWidth, .flexibleHeight]
      addSubview(collection)
      self.collection = collection
    }
    collection.configure(rendererId: rendererId, itemCount: max(0, itemCount), revision: revision)
  }
}

private final class SynchronousCollectionView: UICollectionView, UICollectionViewDataSource {
  private let pool: ExpoUISynchronousCollectionRootPool
  private var rendererId = ""
  private var itemCount = 0
  private var revision = -1
  private var pending: (rendererId: String, itemCount: Int, revision: Int)?
  private var updateScheduled = false

  init(pool: ExpoUISynchronousCollectionRootPool) {
    self.pool = pool
    super.init(frame: .zero, collectionViewLayout: ExpoUISynchronousCollectionLayout())
    dataSource = self
    backgroundColor = .systemBackground
    alwaysBounceVertical = true
    allowsSelection = false
    // Exercise on-demand rendering without an extra prepared-cell window.
    isPrefetchingEnabled = false
    if #available(iOS 16.0, tvOS 16.0, *) {
      selfSizingInvalidation = .enabledIncludingConstraints
    }
    register(SynchronousCollectionCell.self, forCellWithReuseIdentifier: "row")
  }

  required init?(coder: NSCoder) {
    return nil
  }

  func configure(rendererId: String, itemCount: Int, revision: Int) {
    guard self.rendererId != rendererId || self.itemCount != itemCount || self.revision != revision else {
      pending = nil
      return
    }
    pending = (rendererId, itemCount, revision)
    guard !updateScheduled else { return }
    updateScheduled = true
    // updateUIView can run inside the parent Fabric mount. Reload after that
    // stack unwinds so cell creation can enter the synchronous row renderer.
    DispatchQueue.main.async { [weak self] in
      guard let self else { return }
      self.updateScheduled = false
      guard self.window != nil, let pending = self.pending else { return }
      self.pending = nil
      self.rendererId = pending.rendererId
      self.itemCount = pending.itemCount
      self.revision = pending.revision
      (self.collectionViewLayout as? ExpoUISynchronousCollectionLayout)?.resetMeasurements()
      self.reloadData()
    }
  }

  func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
    itemCount
  }

  func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
    let cell = dequeueReusableCell(withReuseIdentifier: "row", for: indexPath)
    if let cell = cell as? SynchronousCollectionCell {
      cell.configure(pool: pool, rendererId: rendererId, index: indexPath.item, revision: revision)
    }
    return cell
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil, let pending {
      configure(rendererId: pending.rendererId, itemCount: pending.itemCount, revision: pending.revision)
    }
  }

}

private final class SynchronousCollectionCell: UICollectionViewCell {
  private var row: ExpoUISynchronousCollectionRow?
  private static let horizontalInset: CGFloat = 16

  func configure(pool: ExpoUISynchronousCollectionRootPool, rendererId: String, index: Int, revision: Int) {
    let row: ExpoUISynchronousCollectionRow
    if let existing = self.row {
      row = existing
    } else {
      row = ExpoUISynchronousCollectionRow(pool: pool)
      self.row = row
      row.translatesAutoresizingMaskIntoConstraints = false
      contentView.addSubview(row)
      NSLayoutConstraint.activate([
        row.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: Self.horizontalInset),
        row.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -Self.horizontalInset),
        row.topAnchor.constraint(equalTo: contentView.topAnchor),
        row.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
      ])
    }
    row.configure(withRenderer: rendererId, index: index, revision: revision)
  }

  override func preferredLayoutAttributesFitting(_ layoutAttributes: UICollectionViewLayoutAttributes) -> UICollectionViewLayoutAttributes {
    guard let row,
      let attributes = layoutAttributes.copy() as? UICollectionViewLayoutAttributes else {
      return super.preferredLayoutAttributesFitting(layoutAttributes)
    }
    let width = attributes.size.width - 2 * Self.horizontalInset
    guard width.isFinite, width > 0 else { return attributes }
    let size = row.render(withWidth: width)
    attributes.size.height = size.height
    return attributes
  }

  override func prepareForReuse() {
    super.prepareForReuse()
    releaseRoot()
  }

  func releaseRoot() {
    row?.releaseRoot()
  }
}
