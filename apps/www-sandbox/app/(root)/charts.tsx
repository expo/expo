import Charts from '@/components/www/charts';
import { Stack } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import '@/global.css';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  LabelList,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  Rectangle,
  ReferenceLine,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Separator } from '@/components/ui/separator';
import { isWebview } from 'expo/dom';

import ChartInner from '@/components/www/inner-chart';
import { useState } from 'react';

export default function Route() {
  const [height, setHeight] = useState(270);
  return (
    <ScrollView style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: 'Charts',
        }}
      />

      <View className="lg:max-w-md" x-chunk="charts-01-chunk-0">
        <CardHeader className="space-y-0 pb-2">
          <CardDescription>Today</CardDescription>
          <CardTitle className="text-4xl tabular-nums">
            12,584{' '}
            <Text className="font-sans text-sm font-normal tracking-normal text-muted-foreground">
              steps
            </Text>
          </CardTitle>
        </CardHeader>
        <CardContent style={{ minHeight: height, padding: 16 }}>
          <ChartInner
            updateSize={(size) => {
              // console.log('{GOT} Native size:', size);
              // if (size[1] !== height) {
              //   console.log('Native size:', size[1]);
              //   setHeight(size[1]);
              // } else {
              //   console.log('Skip size:', size[1]);
              // }
            }}
            webview={{
              style: { height },
              scrollEnabled: false,
            }}
          />
        </CardContent>
        <CardFooter className="flex-col items-start gap-1">
          <CardDescription>
            Over the past 7 days, you have walked{' '}
            <Text className="font-medium text-foreground">53,305</Text> steps.
          </CardDescription>
          <CardDescription>
            You need <Text className="font-medium text-foreground">12,584</Text> more steps to reach
            your goal.
          </CardDescription>
        </CardFooter>
      </View>

      <Charts
        webview={{
          style: { height: 2200 },
          scrollEnabled: false,
        }}
      />
    </ScrollView>
  );
}
