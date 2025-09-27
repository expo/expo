import {
  Chart,
  Picker,
  ChartType,
  LineChartStyle,
  PointChartStyle,
  PointStyle,
  ChartDataPoint,
  RuleChartStyle,
  Host,
} from '@expo/ui/swift-ui';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import HeadingText from '../../components/HeadingText';
import MonoText from '../../components/MonoText';

const lineDashArrays: (number[] | undefined)[] = [undefined, [5, 5], [2, 2]];
const pointStyles: PointStyle[] = ['circle', 'square', 'diamond'];

const lineStyleOptions = ['Solid', 'Dashed', 'Dotted'];
const pointStyleOptions = ['Circle', 'Square', 'Diamond'];

const ruleLineWidths = [1, 2, 4];
const ruleDashArrays: (number[] | undefined)[] = [undefined, [5, 5], [2, 2]];
const ruleLineWidthOptions = ['1pt', '2pt', '4pt'];
const ruleDashOptions = ['Solid', 'Dashed', 'Dotted'];

const salesData: ChartDataPoint[] = [
  { x: 'Jan', y: 15 },
  { x: 'Feb', y: 25 },
  { x: 'Mar', y: 18 },
  { x: 'Apr', y: 32 },
  { x: 'May', y: 28 },
  { x: 'Jun', y: 35 },
];

const temperatureData: ChartDataPoint[] = [
  { x: 'Mon', y: 20, color: '#4A90E2' },
  { x: 'Tue', y: 22, color: '#50C8D8' },
  { x: 'Wed', y: 18, color: '#5AD67D' },
  { x: 'Thu', y: 25, color: '#F5D76E' },
  { x: 'Fri', y: 23, color: '#FF8C42' },
  { x: 'Sat', y: 27, color: '#FF6B6B' },
  { x: 'Sun', y: 24, color: '#D63384' },
];

const performanceData: ChartDataPoint[] = [
  { x: 'Q1', y: 75 },
  { x: 'Q2', y: 85 },
  { x: 'Q3', y: 65 },
  { x: 'Q4', y: 95 },
];

const salesAnnotations: ChartDataPoint[] = [
  { x: 'Sales Target', y: 30, color: '#10B981' },
  { x: 'Average', y: 25, color: '#F59E0B' },
  { x: 'Minimum', y: 15, color: '#EF4444' },
];

const temperatureAnnotations: ChartDataPoint[] = [
  { x: 'Hot', y: 25, color: '#EF4444' },
  { x: 'Average', y: 22, color: '#F59E0B' },
  { x: 'Cool', y: 18, color: '#3B82F6' },
];

const performanceAnnotations: ChartDataPoint[] = [
  { x: 'Excellent', y: 90, color: '#10B981' },
  { x: 'Target', y: 80, color: '#F59E0B' },
  { x: 'Minimum', y: 65, color: '#EF4444' },
];

type DataSet = 'sales' | 'temperature' | 'performance';

const dataSet: DataSet[] = ['sales', 'temperature', 'performance'];

const charts: ChartType[] = ['line', 'point', 'bar', 'area', 'pie', 'rectangle'];

const chartTypeOptions = ['Line', 'Point', 'Bar', 'Area', 'Pie', 'Rectangle'];
const dataSetOptions = ['Sales', 'Temperature', 'Performance'];
const toggleOptions = ['OFF', 'ON'];

const barCornerRadiusOptions = ['Sharp', 'Rounded', 'Very Rounded'];
const barCornerRadiusValues = [0, 6, 12];
const barWidthOptions = ['Thin', 'Normal', 'Thick'];
const barWidthValues = [20, 25, 35];

const pieInnerRadiusOptions = ['Full Pie', 'Small Donut', 'Medium Donut', 'Large Donut'];
const pieInnerRadiusValues = [0.0, 0.2, 0.4, 0.6];
const pieAngularInsetOptions = ['None', 'Small', 'Medium', 'Large'];
const pieAngularInsetValues = [0, 1, 3, 6];

export default function ChartScreen() {
  const [chartTypeIndex, setChartTypeIndex] = useState(0);
  const [dataSetIndex, setDataSetIndex] = useState(0);
  const [gridIndex, setGridIndex] = useState(1);
  const [animateIndex, setAnimateIndex] = useState(1);
  const [legendIndex, setLegendIndex] = useState(1);

  const [lineStyleIndex, setLineStyleIndex] = useState(0);
  const [pointStyleIndex, setPointStyleIndex] = useState(0);

  const [barCornerRadiusIndex, setBarCornerRadiusIndex] = useState(1);
  const [barWidthIndex, setBarWidthIndex] = useState(1);

  const [pieInnerRadiusIndex, setPieInnerRadiusIndex] = useState(2);
  const [pieAngularInsetIndex, setPieAngularInsetIndex] = useState(2);

  const [showAnnotationsIndex, setShowAnnotationsIndex] = useState(0);
  const [ruleLineWidthIndex, setRuleLineWidthIndex] = useState(1);
  const [ruleDashIndex, setRuleDashIndex] = useState(1);

  const chartType: ChartType = charts[chartTypeIndex];
  const currentDataSet: DataSet = dataSet[dataSetIndex];

  const getCurrentData = () => {
    switch (currentDataSet) {
      case 'temperature':
        return temperatureData;
      case 'performance':
        return performanceData;
      default:
        return salesData;
    }
  };

  const getCurrentAnnotations = () => {
    switch (currentDataSet) {
      case 'temperature':
        return temperatureAnnotations;
      case 'performance':
        return performanceAnnotations;
      default:
        return salesAnnotations;
    }
  };

  const getChartColor = () => {
    switch (chartType) {
      case 'line':
        return '#6366F1';
      case 'point':
        return '#EC4899';
      case 'area':
        return '#10B981';
      case 'rectangle':
        return '#8B5CF6';
      default:
        return '#6366F1';
    }
  };

  const getLineStyle = (): LineChartStyle => {
    return {
      dashArray: lineDashArrays[lineStyleIndex],
      width: 3,
      pointStyle: pointStyles[pointStyleIndex],
      pointSize: 8,
      color: getChartColor(),
    };
  };

  const getPointStyle = (): PointChartStyle => {
    return {
      pointStyle: pointStyles[pointStyleIndex],
      pointSize: 8,
    };
  };

  const getAreaStyle = () => {
    return {
      color: getChartColor(),
    };
  };

  const getBarStyle = () => {
    return {
      cornerRadius: barCornerRadiusValues[barCornerRadiusIndex],
      width: barWidthValues[barWidthIndex],
    };
  };

  const getPieStyle = () => {
    return {
      innerRadius: pieInnerRadiusValues[pieInnerRadiusIndex],
      angularInset: pieAngularInsetValues[pieAngularInsetIndex],
    };
  };

  const getRectangleStyle = () => {
    return {
      color: getChartColor(),
      cornerRadius: barCornerRadiusValues[barCornerRadiusIndex],
    };
  };

  const getRuleStyle = (): RuleChartStyle => {
    return {
      color: '#FF6B6B',
      lineWidth: ruleLineWidths[ruleLineWidthIndex],
      dashArray: ruleDashArrays[ruleDashIndex],
    };
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <HeadingText style={styles.heading}>Native Swift Charts with Styling</HeadingText>
      <Text style={styles.description}>
        Interactive charts with custom styling options per chart type (iOS 16+)
        {'\n'}Pie charts require iOS 17+
      </Text>
      <View style={styles.chartContainer}>
        <Host style={{ flex: 1 }}>
          <Chart
            data={getCurrentData()}
            type={chartType}
            showGrid={gridIndex === 1}
            animate={animateIndex === 1}
            showLegend={legendIndex === 1}
            referenceLines={showAnnotationsIndex === 1 ? getCurrentAnnotations() : []}
            lineStyle={chartType === 'line' ? getLineStyle() : undefined}
            pointStyle={chartType === 'point' ? getPointStyle() : undefined}
            areaStyle={chartType === 'area' ? getAreaStyle() : undefined}
            barStyle={chartType === 'bar' ? getBarStyle() : undefined}
            pieStyle={chartType === 'pie' ? getPieStyle() : undefined}
            rectangleStyle={chartType === 'rectangle' ? getRectangleStyle() : undefined}
            ruleStyle={showAnnotationsIndex === 1 ? getRuleStyle() : undefined}
            style={styles.chart}
          />
        </Host>
      </View>
      <View style={styles.settingsContainer}>
        <MonoText textStyle={styles.settings}>
          Type: {chartType} | Data: {dataSet} | Grid: {gridIndex === 1 ? 'ON' : 'OFF'} | Animate:{' '}
          {animateIndex === 1 ? 'ON' : 'OFF'} | Legend: {legendIndex === 1 ? 'ON' : 'OFF'} |
          Annotations: {showAnnotationsIndex === 1 ? 'ON' : 'OFF'}
        </MonoText>
      </View>
      <HeadingText style={styles.controlHeading}>Chart Type</HeadingText>
      <View style={styles.pickerContainer}>
        <Host matchContents>
          <Picker
            options={chartTypeOptions}
            selectedIndex={chartTypeIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setChartTypeIndex(index);
            }}
            variant="segmented"
          />
        </Host>
      </View>
      <HeadingText style={styles.controlHeading}>Data Set</HeadingText>
      <View style={styles.pickerContainer}>
        <Host matchContents>
          <Picker
            options={dataSetOptions}
            selectedIndex={dataSetIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setDataSetIndex(index);
            }}
            variant="segmented"
          />
        </Host>
      </View>
      {(chartType === 'line' || chartType === 'point') && (
        <>
          <HeadingText style={styles.controlHeading}>
            {chartType === 'line' ? 'Line Styling' : 'Point Styling'}
          </HeadingText>
          <Text style={styles.optionLabel}>Line Style</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={lineStyleOptions}
                selectedIndex={lineStyleIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setLineStyleIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
          <Text style={styles.optionLabel}>Point Style</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={pointStyleOptions}
                selectedIndex={pointStyleIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setPointStyleIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
        </>
      )}
      {chartType === 'bar' && (
        <>
          <HeadingText style={styles.controlHeading}>Bar Styling</HeadingText>

          <Text style={styles.optionLabel}>Corner Radius</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={barCornerRadiusOptions}
                selectedIndex={barCornerRadiusIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setBarCornerRadiusIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
          <Text style={styles.optionLabel}>Bar Width</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={barWidthOptions}
                selectedIndex={barWidthIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setBarWidthIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
        </>
      )}
      {chartType === 'pie' && (
        <>
          <HeadingText style={styles.controlHeading}>Pie Styling</HeadingText>
          <Text style={styles.optionLabel}>Inner Radius</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={pieInnerRadiusOptions}
                selectedIndex={pieInnerRadiusIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setPieInnerRadiusIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
          <Text style={styles.optionLabel}>Angular Inset</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={pieAngularInsetOptions}
                selectedIndex={pieAngularInsetIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setPieAngularInsetIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
        </>
      )}
      {chartType === 'rectangle' && (
        <>
          <HeadingText style={styles.controlHeading}>Rectangle Styling</HeadingText>
          <Text style={styles.optionLabel}>Corner Radius</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={barCornerRadiusOptions}
                selectedIndex={barCornerRadiusIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setBarCornerRadiusIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
        </>
      )}
      <HeadingText style={styles.controlHeading}>Options</HeadingText>
      <Text style={styles.optionLabel}>Grid</Text>
      <View style={styles.pickerContainer}>
        <Host matchContents>
          <Picker
            options={toggleOptions}
            selectedIndex={gridIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setGridIndex(index);
            }}
            variant="segmented"
          />
        </Host>
      </View>
      <Text style={styles.optionLabel}>Animate</Text>
      <View style={styles.pickerContainer}>
        <Host matchContents>
          <Picker
            options={toggleOptions}
            selectedIndex={animateIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setAnimateIndex(index);
            }}
            variant="segmented"
          />
        </Host>
      </View>
      <Text style={styles.optionLabel}>Legend</Text>
      <Text style={styles.optionDescription}>Useful for bar and pie charts</Text>
      <View style={styles.pickerContainer}>
        <Host matchContents>
          <Picker
            options={toggleOptions}
            selectedIndex={legendIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setLegendIndex(index);
            }}
            variant="segmented"
          />
        </Host>
      </View>
      <Text style={styles.optionLabel}>Annotations</Text>
      <Text style={styles.optionDescription}>Add rule mark annotations to charts</Text>
      <View style={styles.pickerContainer}>
        <Host matchContents>
          <Picker
            options={toggleOptions}
            selectedIndex={showAnnotationsIndex}
            onOptionSelected={({ nativeEvent: { index } }) => {
              setShowAnnotationsIndex(index);
            }}
            variant="segmented"
          />
        </Host>
      </View>
      {showAnnotationsIndex === 1 && (
        <>
          <Text style={styles.optionLabel}>Rule Line Width</Text>
          <Text style={styles.optionDescription}>Set the thickness of rule lines</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={ruleLineWidthOptions}
                selectedIndex={ruleLineWidthIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setRuleLineWidthIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
          <Text style={styles.optionLabel}>Rule Line Style</Text>
          <Text style={styles.optionDescription}>Set the dash pattern for rule lines</Text>
          <View style={styles.pickerContainer}>
            <Host matchContents>
              <Picker
                options={ruleDashOptions}
                selectedIndex={ruleDashIndex}
                onOptionSelected={({ nativeEvent: { index } }) => {
                  setRuleDashIndex(index);
                }}
                variant="segmented"
              />
            </Host>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
  },
  heading: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  unsupportedText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    color: '#FF3B30',
  },
  chartContainer: {
    height: 250,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  chart: {
    flex: 1,
  },
  settingsContainer: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  settings: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
  },
  controlHeading: {
    fontSize: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: 8,
    color: '#333',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
});
