import { useFilteredModules } from '@/components/deps-context';
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

export default function DataTableDemo() {
  const data = useFilteredModules();

  const { threads, items } = React.useMemo(() => {
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
      acc[thread] = index + 1;
      return acc;
    }, {});

    items.forEach((item) => {
      item.thread = threadMap[item.thread];
    });
    return { threads: Object.values(threadMap).sort().reverse(), items };
  }, [data]);

  function renderItem(params, api) {
    const categoryIndex = api.value(0);
    const start = api.coord([api.value(1), categoryIndex]);
    const end = api.coord([api.value(2), categoryIndex]);
    const height = api.size([0, 1])[1] * 0.6;
    // return null;
    const rectShape = echarts.graphic.clipRectByRect(
      {
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height,
      },
      {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height,
      }
    );
    return (
      rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: rectShape,
        style: api.style(),
      }
    );
  }

  const start = items.reduce((acc, item) => Math.min(acc, item.start), Infinity);

  const container = React.useRef<HTMLDivElement>(null);

  const containerHeight = React.useMemo(() => {
    if (!container.current) {
      return 300;
    }
    return container.current.clientHeight;
  }, [container.current]);

  return (
    <div className="w-full m-4 relative flex flex-1 bg-white" ref={container}>
      <div className="flex-1">
        <ReactECharts
          lazyUpdate
          opts={{
            // renderer: 'svg',
            height: containerHeight,
          }}
          theme="dark"
          loadingOption={{}}
          option={{
            tooltip: {
              formatter(params) {
                return params.marker + params.name + ': ' + params.value[3] + ' ms';
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
                top: 500,
                labelFormatter: '',
              },
              {
                type: 'inside',
                filterMode: 'weakFilter',
              },
            ],
            grid: {
              height: 400,
            },
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
              boundaryGap: false,
              data: threads.map((thread) => 'Thread: ' + String(thread)),
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
                  value: [item.thread, item.start, item.end, item.end - item.start],
                  itemStyle: {
                    normal: {
                      color: getColor(item.name),
                    },
                  },
                })),
              },
            ],
          }}
        />
      </div>
    </div>
  );
}
