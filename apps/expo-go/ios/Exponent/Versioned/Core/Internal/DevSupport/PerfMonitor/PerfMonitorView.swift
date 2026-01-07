// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import UIKit

struct PerfMonitorView: View {
  @ObservedObject var viewModel: PerfMonitorViewModel

  private static let cardCornerRadius: CGFloat = 18
  private static let graphHeight: CGFloat = 58
  private static let cardBackground = Color(red: 0.11, green: 0.12, blue: 0.16)
  private static let accentColor = Color(red: 0.27, green: 0.55, blue: 0.98)
  private static let borderColor = Color.white.opacity(0.08)

  private var cardWidth: CGFloat {
    min(UIScreen.main.bounds.width * PerfMonitorConstants.screenWidthRatio, PerfMonitorConstants.maxWidth)
  }

  var body: some View {
    VStack(spacing: 12) {
      header

      VStack(spacing: 12) {
        fpsSection
        statsSection
      }
    }
    .padding(16)
    .frame(width: cardWidth)
    .background(Self.cardBackground)
    .clipShape(RoundedRectangle(cornerRadius: Self.cardCornerRadius, style: .continuous))
    .overlay(
      RoundedRectangle(cornerRadius: Self.cardCornerRadius, style: .continuous)
        .stroke(Self.borderColor, lineWidth: 1)
    )
    .shadow(color: Color.black.opacity(0.5), radius: 22, x: 0, y: 12)
    .preferredColorScheme(.dark)
  }

  private var header: some View {
    HStack(spacing: 12) {
      Image(systemName: "arrow.up.and.down.and.arrow.left.and.right")
        .font(.system(size: 13, weight: .semibold))
        .foregroundColor(Color.white.opacity(0.75))
        .frame(width: 28, height: 28)
      Spacer()
      Text("Performance monitor")
        .font(.system(size: 16, weight: .semibold, design: .rounded))
        .foregroundColor(.white.opacity(0.95))
      Spacer()
      Button(action: {
        viewModel.closeMonitor()
      }) {
        Image(systemName: "xmark.circle.fill")
          .foregroundColor(Color.white.opacity(0.8))
          .font(.system(size: 20, weight: .semibold))
      }
      .buttonStyle(.plain)
    }
  }

  private var fpsSection: some View {
    HStack(spacing: 12) {
      PerfMonitorTrackView(
        snapshot: viewModel.snapshot.uiTrack,
        accentColor: Self.accentColor,
        height: Self.graphHeight
      )

      PerfMonitorTrackView(
        snapshot: viewModel.snapshot.jsTrack,
        accentColor: Self.accentColor,
        height: Self.graphHeight
      )
    }
  }

  private var statsSection: some View {
    HStack(spacing: 12) {
      PerfMonitorStatCard(
        title: "RAM",
        value: viewModel.snapshot.formattedMemory,
        unit: "MB",
      )
      PerfMonitorStatCard(
        title: "Hermes",
        value: viewModel.snapshot.formattedHeap,
        unit: "MB",
      )
      PerfMonitorStatCard(
        title: "Layout",
        value: viewModel.snapshot.formattedLayoutDuration,
        unit: "ms"
      )
    }
  }
}

private struct PerfMonitorTrackView: View {
  let snapshot: PerfMonitorTrackSnapshot
  let accentColor: Color
  let height: CGFloat

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      GraphView(values: snapshot.history, accentColor: accentColor)
        .frame(height: height)

      HStack {
        Text(snapshot.label.uppercased())
          .font(.caption)
          .foregroundColor(Color.white.opacity(0.65))
        Spacer()
        Text(snapshot.formattedFPS)
          .font(.system(size: 15, weight: .semibold, design: .rounded))
          .foregroundColor(.white)
      }
    }
    .padding(12)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(Color.white.opacity(0.08))
    )
  }
}

private struct GraphView: View {
  static let minFPS: Double = 0
  static let maxFPS: Double = 120

  let values: [Double]
  let accentColor: Color

  var body: some View {
    GeometryReader { proxy in
      let points = normalizedPoints(in: proxy.size)
      ZStack(alignment: .bottomLeading) {
        gradientFill(for: points, in: proxy.size)
        linePath(for: points)
      }
    }
  }

  private func gradientFill(for points: [CGPoint], in size: CGSize) -> some View {
    LinearGradient(
      gradient: Gradient(colors: [accentColor.opacity(0.5), accentColor.opacity(0.08)]),
      startPoint: .top,
      endPoint: .bottom
    )
    .mask(
      Path { path in
        guard let first = points.first else {
          return
        }
        path.move(to: CGPoint(x: first.x, y: size.height))
        path.addLine(to: first)
        points.forEach { path.addLine(to: $0) }
        path.addLine(to: CGPoint(x: points.last?.x ?? size.width, y: size.height))
        path.closeSubpath()
      }
    )
  }

  private func linePath(for points: [CGPoint]) -> some View {
    Path { path in
      guard let first = points.first else {
        return
      }
      path.move(to: first)
      points.dropFirst().forEach { path.addLine(to: $0) }
    }
    .stroke(accentColor, style: StrokeStyle(lineWidth: 2.2, lineCap: .round, lineJoin: .round))
  }

  private func normalizedPoints(in size: CGSize) -> [CGPoint] {
    guard !values.isEmpty else {
      return []
    }

    let clampedValues = values.map { min(max($0, Self.minFPS), Self.maxFPS) }
    let range = Self.maxFPS - Self.minFPS
    let stepX = size.width / CGFloat(max(values.count - 1, 1))

    return clampedValues.enumerated().map { index, value in
      let normalized = (value - Self.minFPS) / range
      return CGPoint(
        x: CGFloat(index) * stepX,
        y: size.height * (1 - CGFloat(normalized))
      )
    }
  }
}

private struct PerfMonitorStatCard: View {
  let title: String
  let value: String
  let unit: String

  var body: some View {
    VStack(spacing: 6) {
      Text(title)
        .font(.caption)
        .foregroundColor(.white.opacity(0.6))
      HStack(alignment: .firstTextBaseline, spacing: 2) {
        Text(value)
          .font(.system(size: 18, weight: .semibold, design: .rounded))
          .foregroundColor(.white)
        Text(unit)
          .font(.caption2)
          .foregroundColor(.white.opacity(0.6))
      }
    }
    .frame(maxWidth: .infinity)
    .frame(height: 60)
    .background(
      RoundedRectangle(cornerRadius: 14, style: .continuous)
        .fill(.white.opacity(0.08))
    )
  }
}
