'use webview';

import '@/global.css';

import { Bar, BarChart, Label, Rectangle, ReferenceLine, XAxis } from 'recharts';

import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useEffect } from 'react';

function useSize(callback: (size: [number, number]) => void) {
  useEffect(() => {
    // Observe window size changes
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        callback([width, height]);
      }
    });

    observer.observe(document.body);

    callback([document.body.clientWidth, document.body.clientHeight]);

    return () => {
      observer.disconnect();
    };
  }, [callback]);
}

export default function Route({
  updateSize,
}: {
  webview: import('expo/webview').WebViewProps;
  updateSize(size: [number, number]);
}) {
  useSize(updateSize);
  return (
    <Card className="w-full" x-chunk="charts-01-chunk-0">
      <ChartContainer
        config={{
          steps: {
            label: 'Steps',
            color: 'hsl(var(--chart-1))',
          },
        }}>
        <BarChart
          accessibilityLayer
          margin={{
            left: -4,
            right: -4,
          }}
          data={[
            {
              date: '2024-01-01',
              steps: 2000,
            },
            {
              date: '2024-01-02',
              steps: 2100,
            },
            {
              date: '2024-01-03',
              steps: 2200,
            },
            {
              date: '2024-01-04',
              steps: 1300,
            },
            {
              date: '2024-01-05',
              steps: 1400,
            },
            {
              date: '2024-01-06',
              steps: 2500,
            },
            {
              date: '2024-01-07',
              steps: 1600,
            },
          ]}>
          <Bar
            dataKey="steps"
            fill="var(--color-steps)"
            radius={5}
            fillOpacity={0.6}
            activeBar={<Rectangle fillOpacity={0.8} />}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tickFormatter={(value) => {
              return new Date(value).toLocaleDateString('en-US', {
                weekday: 'short',
              });
            }}
          />
          <ChartTooltip
            defaultIndex={2}
            content={
              <ChartTooltipContent
                hideIndicator
                labelFormatter={(value) => {
                  return new Date(value).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  });
                }}
              />
            }
            cursor={false}
          />
          <ReferenceLine
            y={1200}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            strokeWidth={1}>
            <Label
              position="insideBottomLeft"
              value="Average Steps"
              offset={10}
              fill="hsl(var(--foreground))"
            />
            <Label
              position="insideTopLeft"
              value="12,343"
              className="text-lg"
              fill="hsl(var(--foreground))"
              offset={10}
              startOffset={100}
            />
          </ReferenceLine>
        </BarChart>
      </ChartContainer>
    </Card>
  );
}
