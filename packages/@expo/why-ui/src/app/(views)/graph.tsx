import { MetroJsonModule } from '@/components/data';
import { useGraph } from '@/components/deps-context';
import { useDynamicHeight } from '@/components/useDynamicHeight';
import ReactECharts from 'echarts-for-react';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';

export default function Route() {
  const { modules } = useGraph();

  return (
    <div className="flex flex-1 flex-row">
      <TreemapGraph modules={modules.filter((m) => m.nodeModuleName !== 'react-native')} />
      <div className="flex flex-1 border-l border-l-[#ffffff1a]"></div>
    </div>
  );
}

export type EChartTreeMapDataItem = {
  name: string;
  path: string;
  value: [number, number];
  moduleHref?: string;
  tip: string;
  sizeString: string;
  ratio: number;
  childCount: number;
  ratioString: string;
  children?: EChartTreeMapDataItem[];
  nodeModuleName: string;
  isNodeModuleRoot?: boolean;
};

export const colors = Object.entries({
  ts: '#41b1e0',
  js: '#d6cb2d',
  json: '#cf8f30',
  css: '#e6659a',
  html: '#e34c26',
  svelte: '#ff3e00',
  jsx: '#7d6fe8',
  tsx: '#7d6fe8',
}).map(([type, color]) => ({ type, color }));

function unique<T>(arr: T[]) {
  return Array.from(new Set(arr));
}

function getModuleWeight(mod: MetroJsonModule, mode: 'deps' | 'transform' | 'resolveId') {
  const value = 10 + Math.min(mod.dependencies.length, 30);
  // const value = 10 + (mode === 'deps' ? Math.min(mod.dependencies.length, 30) : Math.min(mod.plugins.reduce((total, plg) => total + (plg[mode as 'transform' | 'resolveId'] || 0), 0) / 20, 30))
  return value;
}

function filterLinks(links: [number, number][]) {
  const uniqueLinks: [number, number][] = [];
  links.forEach((link) => {
    const id1 = link.join(',');
    const id2 = link.reverse().join(',');
    if (
      !uniqueLinks.some((link2) => {
        const id3 = link2.join(',');
        return id1 === id3 || id2 === id3;
      })
    ) {
      uniqueLinks.push(link);
    }
  });
  return uniqueLinks;
}

export function TreemapGraph({ modules }: { modules: MetroJsonModule[] }) {
  const router = useRouter();

  const { data } = useMemo(() => {
    let nodeModuleIndex: { [key: string]: number } = {};
    let lastIndex = 0;
    function indexForNodeModule(moduleName: string) {
      if (nodeModuleIndex[moduleName] == null) {
        nodeModuleIndex[moduleName] = lastIndex++;
      }
      return nodeModuleIndex[moduleName];
    }

    let allNodeModules = unique(modules.map((m) => m.nodeModuleName));

    // Sort by name:
    // allNodeModules = allNodeModules.sort();
    // Sort by number of modules:
    allNodeModules = allNodeModules.sort((a, b) => {
      const aCount = modules.filter((m) => m.nodeModuleName === a).length;
      const bCount = modules.filter((m) => m.nodeModuleName === b).length;
      return bCount - aCount;
    });

    // Populate nodeModuleIndex
    allNodeModules.forEach((m) => indexForNodeModule(m));

    const hueStep = 360 / allNodeModules.length;
    const nodeModulesColorValues = allNodeModules.map((m) => {
      const hueIndex = indexForNodeModule(m);

      const hue = hueStep * hueIndex;

      // Alternate between light and dark
      const saturation = hueIndex % 2 === 0 ? 100 : 50;
      return [m, { h: hue, s: saturation, l: 50 }];
    });

    const nodeModulesColors = Object.fromEntries(
      nodeModulesColorValues.map(([m, { h, s, l }]) => {
        return [m, `hsl(${h}, ${s}%, ${l}%)`];
      })
    );
    const nodeModulesBorderColors = Object.fromEntries(
      nodeModulesColorValues.map(([m, { h, s, l }]) => {
        return [m, `hsl(${h}, ${s}%, ${l * 0.6}%)`];
      })
    );

    let linksInput = modules
      .map((m, index) => {
        return m.dependencies.map((dep) => [index, modules.findIndex((m2) => m2.path === dep)]);
      })
      .flat() as [number, number][];

    linksInput = filterLinks(linksInput);

    // Remove duplicates in any order
    // linksInput = linksInput.filter((link) => {
    //   return !linksInput.some((link2) => JSON.stringify(link2) === JSON.stringify(link.reverse()));
    // });

    let links = linksInput.map(([source, target]) => {
      return {
        source,
        target,
      };
    });

    console.log('links:', links.length);

    return {
      data: {
        // type: 'force',
        categories: allNodeModules.map((m, index) => {
          //   indexForNodeModule(m.nodeModuleName);

          return {
            name: m,
            keyword: {},
            base: 'Other',
            itemStyle: {
              normal: {
                color: nodeModulesColors[m],
              },
            },
          };
        }),
        nodes: modules.map((m) => ({
          id: m.path,
          label: m.path,
          itemStyle: {
            color: nodeModulesColors[m.nodeModuleName],
            borderWidth: 1,
            borderColor: nodeModulesBorderColors[m.nodeModuleName],
          },

          value: getModuleWeight(m, 'deps'),
          symbolSize: getModuleWeight(m, 'deps'),
          // 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow', 'none'
          symbol: m.isEntry ? 'roundRect' : 'circle',
          category: allNodeModules.findIndex((a) => a === m.nodeModuleName),
        })),
        links,
      },
    };
  }, [modules]);

  const container = React.useRef<HTMLDivElement>(null);

  const containerHeight = useDynamicHeight(container, 300);

  return (
    <div className="flex-1" ref={container}>
      <ReactECharts
        lazyUpdate
        opts={{
          // renderer: 'svg',
          // width: containerHeight.width,
          height: containerHeight.height,
          //   width: 'auto',
        }}
        key="1"
        theme="dark"
        onEvents={{
          click(params) {
            console.log('click', params);
            const isModified =
              params.event.event.altKey || params.event.event.ctrlKey || params.event.event.metaKey;
            if (params?.data?.moduleHref && isModified) {
              router.push({
                pathname: '/module/[id]',
                params: { id: params.data.moduleHref },
              });
            }
          },
        }}
        option={{
          backgroundColor: 'transparent',
          legend: {
            data: data.categories.map((category) => category.name),
          },
          series: [
            {
              type: 'graph',
              layout: 'force',
              animation: false,
              label: {
                position: 'right',
                formatter: '{b}',
              },
              roam: 'move',
              draggable: true,

              data: data.nodes,
              emphasis: {
                // focus: 'adjacency',
                lineStyle: {
                  width: 10,
                },
              },
              lineStyle: {
                width: 0.5,
                curveness: 0.3,
                opacity: 0.7,
              },
              categories: data.categories,
              force: {
                edgeLength: 5,
                // repulsion: 20,
                gravity: 0.2,
                initLayout: 'circular',
                // gravity: 0
                repulsion: 50,
              },
              edges: data.links,
            },
          ],
        }}
      />
    </div>
  );
}
