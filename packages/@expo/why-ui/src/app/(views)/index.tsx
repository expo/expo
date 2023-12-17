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

    return { start, threads: Object.values(threadMap).sort().reverse(), items };
  }, [data]);
}

function truncateName(name: string, availableWidth: number, fontSize: number): string {
  if (availableWidth < fontSize * 3) return '';
  const maxChars = Math.floor(availableWidth / (fontSize * 0.6)); // Approximation of max chars that can fit
  return name.length > maxChars ? `${name.substring(0, maxChars)}...` : name;
}

export default function DataTableDemo() {
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
    // const fontSize = 14; // adjust font size as needed
    // const truncatedName = truncateName(itemName, rectWidth, fontSize);

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          transition: ['shape'],
          shape: rectShape,
          style: api.style({ fill: api.visual('color'), stroke: '#ffffff87', lineWidth: 0.7 }),
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

  const { start, items, threads } = useProfileData();

  const container = React.useRef<HTMLDivElement>(null);

  const containerHeight = useDynamicHeight(container, 300);
  // console.log(
  //   'containerHeight',
  //   containerHeight,
  //   items.filter((item) => item.thread === 1)
  // );

  console.log(
    'threads',
    threads
    // items.filter((item) => item.thread === 1),
    // items.filter((item) => item.thread === 8)
  );

  const gridHeight = Math.min(containerHeight / 2, 400);

  const option = React.useMemo(() => {
    // Chart options
    return {
      grid: {
        height: gridHeight,
      },

      backgroundColor: 'transparent',

      tooltip: {
        formatter(params) {
          return params.marker + params.name + ': ' + (params.value[2] - params.value[1]) + ' ms';
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
          showDataShadow: false,
          top: gridHeight + 100,
          labelFormatter: '',
        },
        {
          type: 'inside',
          filterMode: 'weakFilter',
        },
      ],

      xAxis: {
        min: start,
        scale: true,
        axisLabel: {
          formatter(val) {
            return Math.max(0, val - start) + ' ms';
          },
        },
      },
      yAxis: {
        // boundaryGap: false,

        data: threads.map((thread: number) => 'Thread: ' + String(thread + 1)),
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
            value: [
              item.thread,
              item.start,
              item.end,
              // item.name
            ],
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
    <div className="w-full m-4 relative flex flex-1" ref={container}>
      <div className="flex-1">
        <ReactECharts
          lazyUpdate
          opts={{ renderer: 'svg', height: containerHeight }}
          theme="dark"
          option={option}
        />
      </div>
    </div>
  );
}
