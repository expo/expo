import { useFilteredModules } from '@/components/deps-context';
import { useDynamicHeight } from '@/components/useDynamicHeight';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import * as React from 'react';

function getColor(fileName: string): string {
  if (fileName.match(/node_modules/)) {
    return '#008FFB';
    // ['#008FFB', '#fff', '#546E7A', '#26a69a', '#775DD0']
  }
  if (fileName.endsWith('.js')) {
    return '#26a69a';
  }
  return '#775DD0';
}

function useProfileData() {
  const data = useFilteredModules();

  return React.useMemo(() => {
    let items = data
      .map((m) => {
        const profilingData = m.output[0]?.data?.profiling;
        if (!profilingData) {
          return null;
        }

        return {
          name: m.path,
          start: m.output[0].data.profiling.start,
          end: m.output[0].data.profiling.end,
          thread: m.output[0].data.profiling.pid,
        };
      })
      .filter(Boolean);

    // For debugging, we'll sort by end time and then only use the first 50 items.
    // items = items.sort((a, b) => b.end - a.end).slice(0, 50);

    // thread is in the format of random numbers like `20361`, `20356`, `20355`. We need to normalize them to be `0`, `1`, `2` etc.
    const threads = items.map((item) => item.thread);
    const uniqueThreads = [...new Set(threads)].sort().reverse();
    const threadMap = uniqueThreads.reduce((acc, thread, index) => {
      acc[thread] = index;
      return acc;
    }, {});

    items.forEach((item) => {
      item.thread = threadMap[item.thread];
    });
    const start = items.reduce((acc, item) => Math.min(acc, item.start), Infinity);
    const end = items.reduce((acc, item) => Math.max(acc, item.end), -Infinity);

    return { start, end, threads: Object.values(threadMap).sort().reverse(), items };
  }, [data]);
}

function truncateName(name: string, availableWidth: number, fontSize: number): string {
  if (availableWidth < fontSize * 3) return '';
  const maxChars = Math.floor(availableWidth / (fontSize * 0.6)); // Approximation of max chars that can fit
  return name.length > maxChars ? `${name.substring(0, maxChars)}...` : name;
}

export function Profiler() {
  function renderItem(params, api) {
    const categoryIndex = api.value(0);
    const startCoord = api.coord([api.value(1), categoryIndex]);
    const endCoord = api.coord([api.value(2), categoryIndex]);
    const height = api.size([0, 1])[1] * 0.95;
    const rectWidth = endCoord[0] - startCoord[0];

    const rectShape = echarts.graphic.clipRectByRect(
      { x: startCoord[0], y: startCoord[1] - height / 2, width: rectWidth, height },
      {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height,
      }
    );

    if (!rectShape) return null;

    // Truncate item name based on zoom scale

    // const itemName = api.value(3);
    // const fontSize = 10; // adjust font size as needed
    // const truncatedName = truncateName(itemName, rectWidth, fontSize);

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          transition: ['shape'],
          shape: rectShape,
          style: api.style({
            fill: api.visual('color'),
            // stroke: '#ffffff87',
            lineWidth: 0.7,
          }),
        },
        // {
        //   type: 'text',
        //   style: {
        //     text: truncatedName,
        //     x: startCoord[0] + 2, // small padding from the start
        //     y: startCoord[1],
        //     fill: '#fff',
        //     fontSize,
        //   },
        // },
      ],
    };
  }

  // TODO: We need to calculate the profile times outside of the cache to ensure we don't mix and match data.
  const { start, end, items, threads } = useProfileData();

  const container = React.useRef<HTMLDivElement>(null);

  const containerHeight = useDynamicHeight(container, 300);

  const gridHeight = Math.min(100 + threads.length * 30, containerHeight.height);

  const option = React.useMemo(() => {
    // Chart options
    return {
      grid: {
        height: gridHeight,
      },

      backgroundColor: 'transparent',

      tooltip: {
        // trigger: 'axis',
        // axisPointer: {
        //   type: 'line',
        //   axis: 'x',
        //   snap: false,
        // },

        // Reduce padding
        padding: 4,
        textStyle: {
          fontSize: 10,
        },
        backgroundColor: 'rgba(0,0,0,0.9)',
        borderWidth: 1,
        borderColor: '#333',

        formatter(params) {
          // console.log('params', params);
          // return params[0].axisValue;
          // return '';
          const data = params;
          return data.marker + data.name + ': ' + (data.value[2] - data.value[1]) + ' ms';
          // const data = params[0];
          // return data.marker + data.name + ': ' + (data.value[2] - data.value[1]) + ' ms';
        },
      },
      title: {
        text: '',
        left: 'center',
      },
      dataZoom: [
        {
          type: 'slider',
          filterMode: 'weakFilter',
          // showDataShadow: true,
          top: gridHeight + 100,
          labelFormatter: '',

          // Top color
          fillerColor: '#10141D',

          // border color
          borderColor: '#20293A',

          // Add thick lines for handles
          handleStyle: {
            color: '#20293A',
            borderWidth: 3,
          },
        },
        {
          type: 'inside',
          filterMode: 'weakFilter',
        },
      ],

      xAxis: {
        min: start,
        max: end,
        scale: true,
        axisLabel: {
          formatter(val) {
            return reduceDecimal(Math.max(0, val - start)) + ' ms';
          },

          // Make labels more transparent
          color: '#97A3B6',
        },
        axisTick: { show: false },

        // Make border more transparent
        axisLine: { lineStyle: { color: '#20293A' } },
      },
      yAxis: {
        data: threads.map((thread: number) => 'Thread: ' + String(thread + 1)),
        // Hide label
        // Add title "Threads"
        name: 'Threads',
        // Set color
        nameTextStyle: {
          color: '#97A3B6',
        },

        minorSplitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      series: [
        {
          type: 'custom',
          renderItem,

          itemStyle: {
            opacity: 1,
          },
          encode: {
            x: [1, 2],
            y: 0,
          },
          data: items.map((item) => ({
            name: item.name,
            value: [item.thread, item.start, item.end, item.name],
            itemStyle: {
              normal: {
                color: getColor(item.name),
              },
            },
          })),
        },
      ],
    };
  }, [items, start, containerHeight]);

  return (
    <div className="w-full relative flex flex-1" ref={container}>
      <div className="flex-1">
        <ReactECharts
          lazyUpdate
          opts={{
            // renderer: 'svg',
            // width: containerHeight.width,
            height: containerHeight.height,
          }}
          theme="dark"
          option={option}
        />
      </div>
    </div>
  );
}

function reduceDecimal(num: number): number {
  return Math.round(num * 10) / 10;
}
