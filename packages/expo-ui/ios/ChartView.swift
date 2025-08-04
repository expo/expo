// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import Charts

internal enum ChartType: String, Enumerable {
  case line
  case point
  case bar
  case area
  case pie
}

internal struct ChartDataPoint: Record {
  @Field var x: String
  @Field var y: Double
  @Field var color: Color?
}

internal enum LineStyle: String, Enumerable {
  case solid
  case dashed
  case dotted
}

internal enum PointStyle: String, Enumerable {
  case circle
  case square
  case diamond
}

internal struct LineChartStyle: Record {
  @Field var style: LineStyle = .solid
  @Field var width: Double = 2.0
  @Field var pointStyle: PointStyle = .circle
  @Field var pointSize: Double = 6.0
  @Field var color: Color?
}

internal struct AreaChartStyle: Record {
  @Field var color: Color?
}

internal struct BarChartStyle: Record {
  @Field var cornerRadius: Double = 0.0
  @Field var width: Double?
}

internal struct PieChartStyle: Record {
  @Field var innerRadius: Double = 0.3
  @Field var angularInset: Double = 2.0
}

internal struct PointChartStyle: Record {
  @Field var pointStyle: PointStyle = .circle
  @Field var pointSize: Double = 6.0
}

final class ChartProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var data: [ChartDataPoint] = []
  @Field var type: ChartType = .line
  @Field var showGrid: Bool = true
  @Field var animate: Bool = true
  @Field var showLegend: Bool = false
  @Field var lineStyle: LineChartStyle?
  @Field var pointStyle: PointChartStyle?
  @Field var areaStyle: AreaChartStyle?
  @Field var barStyle: BarChartStyle?
  @Field var pieStyle: PieChartStyle?
}

internal struct ChartView: ExpoSwiftUI.View {
  @ObservedObject var props: ChartProps

  @available(iOS 16.0, *)
  private func createBaseBarMark(for dataPoint: ChartDataPoint) -> BarMark {
    props.barStyle?.width != nil ?
      BarMark(x: .value("X", dataPoint.x), y: .value("Y", dataPoint.y), width: .fixed(CGFloat(props.barStyle?.width ?? 0))) :
      BarMark(x: .value("X", dataPoint.x), y: .value("Y", dataPoint.y))
  }

  @available(iOS 17.0, *)
  private func createBasePieMark(for dataPoint: ChartDataPoint) -> SectorMark {
    let style = props.pieStyle ?? PieChartStyle()
    return SectorMark(angle: .value("Value", dataPoint.y), innerRadius: .ratio(style.innerRadius), angularInset: style.angularInset)
  }

  @available(iOS 16.0, *)
  private func createAreaMark(for dataPoint: ChartDataPoint) -> some ChartContent {
    AreaMark(x: .value("X", dataPoint.x), y: .value("Y", dataPoint.y))
      .foregroundStyle(props.areaStyle?.color ?? .blue)
  }

  @available(iOS 16.0, *)
  private func createLineMark(for dataPoint: ChartDataPoint) -> some ChartContent {
    LineMark(x: .value("X", dataPoint.x), y: .value("Y", dataPoint.y))
      .foregroundStyle(props.lineStyle?.color ?? .blue)
      .symbol(getSymbol(props.lineStyle?.pointStyle ?? .circle))
      .symbolSize(CGFloat(props.lineStyle?.pointSize ?? 6.0))
      .lineStyle(getLineStyle(props.lineStyle?.style ?? .solid))
      .lineStyle(.init(lineWidth: CGFloat(props.lineStyle?.width ?? 2.0)))
  }

  @available(iOS 16.0, *)
  private func createPointMark(for dataPoint: ChartDataPoint) -> some ChartContent {
    PointMark(x: .value("X", dataPoint.x), y: .value("Y", dataPoint.y))
      .foregroundStyle(dataPoint.color ?? .blue)
      .symbol(getSymbol(props.pointStyle?.pointStyle ?? .circle))
      .symbolSize(CGFloat(props.pointStyle?.pointSize ?? 6.0))
  }

  var body: some View {
    if #available(iOS 16.0, *) {
      let hasIndividualColors = props.data.contains { $0.color != nil }

      Chart(props.data, id: \.x) { dataPoint in
        switch props.type {
        case .line:
          createLineMark(for: dataPoint)
        case .point:
          createPointMark(for: dataPoint)
        case .bar:
          if hasIndividualColors {
            createBaseBarMark(for: dataPoint).foregroundStyle(dataPoint.color ?? .blue).cornerRadius(CGFloat(props.barStyle?.cornerRadius ?? 0.0))
          } else {
            createBaseBarMark(for: dataPoint).foregroundStyle(by: .value("Category", dataPoint.x)).cornerRadius(CGFloat(props.barStyle?.cornerRadius ?? 0.0))
          }
        case .area:
          createAreaMark(for: dataPoint)
        case .pie:
          if #available(iOS 17.0, *) {
            if hasIndividualColors {
              createBasePieMark(for: dataPoint).foregroundStyle(dataPoint.color ?? .blue).opacity(0.8)
            } else {
              createBasePieMark(for: dataPoint).foregroundStyle(by: .value("Category", dataPoint.x)).opacity(0.8)
            }
          }
        }
      }
      .chartXAxis(props.showGrid ? .visible : .hidden)
      .chartYAxis(props.showGrid ? .visible : .hidden)
      .if(props.animate) { chart in
        chart.animation(.easeInOut, value: props.data.count)
      }
      .if(props.showLegend) { chart in
        chart.chartLegend(position: .automatic, spacing: 16)
      }
      .if(!props.showLegend) { chart in
        chart.chartLegend(.hidden)
      }
      .modifier(CommonViewModifiers(props: props))
    }
  }

  @available(iOS 16.0, *)
  private func getSymbol(_ pointStyle: PointStyle) -> BasicChartSymbolShape {
    switch pointStyle {
    case .circle:
      return .circle
    case .square:
      return .square
    case .diamond:
      return .diamond
    }
  }

  private func getLineStyle(_ style: LineStyle) -> StrokeStyle {
    switch style {
    case .solid:
      return StrokeStyle()
    case .dashed:
      return StrokeStyle(dash: [5, 5])
    case .dotted:
      return StrokeStyle(dash: [2, 2])
    }
  }
}
