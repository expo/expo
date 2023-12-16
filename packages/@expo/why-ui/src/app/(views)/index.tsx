import { useFilteredModules } from '@/components/deps-context';
import moment from 'moment';
import * as React from 'react';
import ReactApexChart from 'react-apexcharts';
// make sure you include the timeline stylesheet or the timeline will not be styled
// import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
// import { ArrowUpDown, ChevronDown, MoreHorizontal } from 'lucide-react';
const TimelineItem = ({ item, totalDuration }) => {
  // Calculate width and left offset based on start/end times
  const width = ((item.end - item.start) / totalDuration) * 100;
  const left = (item.start / totalDuration) * 100;

  return (
    <div
      className={`absolute ${item.color} text-white p-1 text-xs`}
      style={{
        left: `${left}%`,
        width: `${width}%`,
        top: `${item.thread * 1.5}rem`, // Adjust 1.5rem to control the spacing between threads
      }}>
      {item.name}
    </div>
  );
};

const ProfilerUI = ({ items }) => {
  const totalDuration = Math.max(...items.map((item) => item.end));

  return (
    <div className="relative h-64 w-full bg-black overflow-x-auto">
      {items.map((item, index) => (
        <TimelineItem key={index} item={item} totalDuration={totalDuration} />
      ))}
    </div>
  );
};

const groups = [
  { id: 1, title: 'group 1' },
  { id: 2, title: 'group 2' },
];

const items = [
  {
    id: 1,
    group: 1,
    title: 'item 1',
    start_time: moment(),
    end_time: moment().add(1, 'hour'),
  },
  {
    id: 2,
    group: 2,
    title: 'item 2',
    start_time: moment().add(-0.5, 'hour'),
    end_time: moment().add(0.5, 'hour'),
  },
  {
    id: 3,
    group: 1,
    title: 'item 3',
    start_time: moment().add(2, 'hour'),
    end_time: moment().add(3, 'hour'),
  },
];

export default function DataTableDemo() {
  const data = useFilteredModules();

  const items = React.useMemo(() => {
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
    const uniqueThreads = [...new Set(threads)];
    const threadMap = uniqueThreads.reduce((acc, thread, index) => {
      acc[thread] = index + 1;
      return acc;
    }, {});

    items.forEach((item) => {
      item.thread = threadMap[item.thread];
    });
    return items;
  }, [data]);

  return (
    <div className="w-full p-4">
      {/* <div className="flex flex-1 space-x-2 py-4"> */}
      {/* <ProfilerUI items={items} /> */}

      <ReactApexChart
        options={{
          chart: {
            height: 600,
            type: 'rangeBar',
          },
          xaxis: {
            type: 'datetime',

            axisBorder: {
              show: false,
              color: '#78909C',
            },
            labels: {
              style: {
                fontSize: '8px',
                colors: '#78909C',
              },
              formatter(val, options) {
                if (typeof options === 'object' && 'dataPointIndex' in options) {
                  return items[options.dataPointIndex].name;
                }

                return '';
              },
              show: true,
            },
            // Adjust to maximize the space for the items
            min: Math.min(...items.map((item) => item.start)),
            max: Math.max(...items.map((item) => item.end)),
          },
          yaxis: {
            show: false,

            // labels: {
            //   // formatter: function (val) {
            //   //   console.log('ar', arguments);
            //   //   return '';
            //   //   // return items[dataPointIndex].name;
            //   // },
            // },
          },
          grid: {
            // Style grid for black background
            borderColor: '#535A60',
            strokeDashArray: 0,
            xaxis: {
              lines: {
                show: true,
              },
            },
            yaxis: {
              lines: {
                show: false,
              },
            },
            padding: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
          dataLabels: {
            enabled: true,

            formatter: function (val, { dataPointIndex }) {
              return items[dataPointIndex].name;
            },
          },

          colors: [
            '#008FFB',
            '#fff',
            '#546E7A',
            '#26a69a',
            // '#775DD0',
          ],
          markers: {
            size: 0,
          },
          plotOptions: {
            bar: {
              borderRadius: 1,
              distributed: true,
              horizontal: true,
              barHeight: '90%',

              rangeBarGroupRows: true,
              dataLabels: {
                // TODO: Better labels
                hideOverflowingLabels: true,
              },
              // Normalize the data points
            },
          },
          // xaxis: {
          //   type: 'datetime',
          // },
        }}
        series={[
          {
            data: items.map((item) => ({
              x: 'Thread: ' + String(item.thread),
              y: [item.start, item.end],
              meta: item.name,
              columnWidthOffset: 0,
            })),
          },
        ]}
        type="rangeBar"
        height={350}
      />
      {/* </div> */}
    </div>
  );
}
