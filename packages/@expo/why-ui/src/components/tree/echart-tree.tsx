import { MetroJsonModule } from '@/components/data';
import { formatSize } from '@/components/table';
import { useDynamicHeight } from '@/components/useDynamicHeight';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';

export type EChartTreeMapDataItem = {
  name: string;
  path: string;
  value: [number, number];
  moduleHref?: string;
  tip: string;
  ratio: number;
  children?: EChartTreeMapDataItem[];
  nodeModuleName: string;
};

// Given a list of modules with filepaths `{ absolutePath: string }[]`, create a recursive tree structure of modules `{ absolutePath: string, groups: T[] }[]`
function createModuleTree(paths: MetroJsonModule[]): {
  data: EChartTreeMapDataItem[];
  maxDepth: number;
  maxNodeModules: number;
} {
  let nodeModuleIndex: { [key: string]: number } = {};
  let lastIndex = 1;
  function indexForNodeModule(moduleName: string) {
    if (nodeModuleIndex[moduleName] == null) {
      nodeModuleIndex[moduleName] = lastIndex++;
    }
    return nodeModuleIndex[moduleName];
  }

  const root: EChartTreeMapDataItem = {
    path: '/',
    children: [],
    name: '/',
    value: [0, 0],
    ratio: 0,
    tip: '',
    nodeModuleName: '',
  };

  let maxDepth = 0;

  paths.forEach((pathObj) => {
    const parts = pathObj.absolutePath.split('/').filter(Boolean);
    let current = root;

    maxDepth = Math.max(maxDepth, parts.length);

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let next = current.children.find((g) => g.path === part);

      if (!next) {
        next = {
          path: part,
          name: part,
          children: [],
          value: [0, 0],
          ratio: 0,
          tip: '',
          nodeModuleName: '',
        };
        current.children.push(next);
      }

      if (isLast) {
        next.path = pathObj.absolutePath;
        next.moduleHref = pathObj.id;
        next.value = [pathObj.size, indexForNodeModule(pathObj.nodeModuleName)];
        next.nodeModuleName = pathObj.nodeModuleName;
      } else {
        next.value[0] += pathObj.size;
      }

      current = next;
    });
  });

  const foldNodeModuleValue = (group: EChartTreeMapDataItem) => {
    // const nodeModuleName = group.children
    if (group.nodeModuleName) {
      return group.nodeModuleName;
    }

    const childNames = group.children
      .map((nm) => {
        // if (nm.path)
        const name = foldNodeModuleValue(nm);
        return nm.name.startsWith('node_modules') ? null : name;
      })
      .filter((name) => name != null);

    const hasTopLevelChild = group.children.some((v) => !v.children.length);

    const hasAmbiguousName = !childNames.every((v) => v === childNames[0]);

    if (
      hasAmbiguousName
      // && (group.name.startsWith('@') || group.name === 'node_modules')
    ) {
      group.nodeModuleName = '';
      group.value[1] = 0; //indexForNodeModule(group.name);
    } else {
      if (hasTopLevelChild || !hasAmbiguousName) {
        group.nodeModuleName = childNames[0];
      } else {
        group.nodeModuleName = '';
      }
      group.value[1] = indexForNodeModule(group.nodeModuleName);
    }

    // if (childNames.every((v) => v === childNames[0])) {
    //   group.nodeModuleName = childNames[0];
    //   group.value[1] = indexForNodeModule(group.nodeModuleName);
    // } else {
    //   group.nodeModuleName = '';
    // }

    return group.nodeModuleName;
  };
  foldNodeModuleValue(root);

  const foldSingleChildGroups = (group: EChartTreeMapDataItem) => {
    if (group.children.length === 1 && group.name !== group.nodeModuleName) {
      const child = group.children[0];
      group.value = child.value;
      group.name = group.name + '/' + child.name;
      group.path = child.path;
      group.children = child.children;
      group.moduleHref = child.moduleHref;
      group.nodeModuleName = child.nodeModuleName;

      foldSingleChildGroups(group); // recursively fold single child children
    } else {
      group.children.forEach(foldSingleChildGroups);
    }
  };
  foldSingleChildGroups(root);

  const unfoldNodeModuleNames = (group: EChartTreeMapDataItem) => {
    for (const child of group.children) {
      // Has children and no nodeModuleName
      if (child.children.length && !child.nodeModuleName && child.name.startsWith('@')) {
        // Split this child into multiple sub children
        for (const subChild of child.children) {
          group.children.push({
            ...subChild,
            name: child.name + '/' + subChild.name,
            path: child.path + '/' + subChild.path,
          });
        }
        // Remove the original child
        group.children.splice(group.children.indexOf(child), 1);
      }
    }

    group.children.forEach(unfoldNodeModuleNames);
  };
  unfoldNodeModuleNames(root);

  // Extrapolate the node module groups so a single group represents the node module name, e.g. { name: `@react-native`, children: [...] } -> [{name: '@react-native/lists'}, {name: '@react-native/scrollview'}]
  //   const extrapolateNodeModules = (group: EChartTreeMapDataItem) => {
  //     if (group.nodeModuleName) {
  //       const nodeModuleGroup = group.children.find((v) => v.name === group.nodeModuleName);
  //       if (nodeModuleGroup) {
  //         group.children = nodeModuleGroup.children;
  //       } else {
  //         group.children = [];
  //       }
  //     }

  //     group.children.forEach(extrapolateNodeModules);
  //   };
  //   extrapolateNodeModules(root);

  // Recalculate the node modules value (#2) relative to the size of the node module overall.
  // First we need to calculate the total size of each node module
  const nodeModuleSizes: { [key: string]: number } = {};

  const getNodeModuleSizesMap = (group: EChartTreeMapDataItem) => {
    if (group.nodeModuleName && !nodeModuleSizes[group.nodeModuleName]) {
      nodeModuleSizes[group.nodeModuleName] = group.value[0];
    }

    group.children.forEach(getNodeModuleSizesMap);
  };
  getNodeModuleSizesMap(root);

  const sizes = Object.entries(nodeModuleSizes).sort((a, b) => b[1] - a[1]);

  const recalculateNodeModuleSizesValue = (group: EChartTreeMapDataItem) => {
    const size = sizes.findIndex(([name]) => name === group.nodeModuleName);
    group.value[1] = size + 1;

    group.children.forEach(recalculateNodeModuleSizesValue);
  };
  recalculateNodeModuleSizesValue(root);

  root.value[0] = root.children.reduce((acc, g) => acc + g.value[0], 0);

  // Calculate the ratio of each group
  const calculateRatio = (group: EChartTreeMapDataItem) => {
    group.ratio = group.value[0] / root.value[0];
    group.children.forEach(calculateRatio);
  };
  calculateRatio(root);

  // Calculate the ratio of each group
  const calculateTooltip = (group: EChartTreeMapDataItem) => {
    const percentage = group.ratio * 100;
    let percetageString = percentage.toFixed(2) + '%';
    if (percentage <= 0.01) {
      percetageString = '< 0.01%';
    }

    const size = formatSize(group.value[0]);
    group.tip = percetageString + ' (' + size + ')';
    group.children.forEach(calculateTooltip);
  };
  calculateTooltip(root);

  return { data: root.children, maxDepth, maxNodeModules: lastIndex };
}

export function TreemapGraph({ modules }: { modules: MetroJsonModule[] }) {
  const router = useRouter();

  const { data, maxDepth, maxNodeModules } = useMemo(
    () =>
      createModuleTree(
        modules.filter((v) =>
          // Remove non-standard modules to prevent shifting the weight scales
          v.absolutePath.startsWith('/')
        )
      ),
    [modules]
  );

  // console.log('data', data, modules);

  const container = React.useRef<HTMLDivElement>(null);

  const containerHeight = useDynamicHeight(container, 300);

  const formatUtil = echarts.format;

  // const sunburstOption = {
  //   series: [
  //     {
  //       type: 'sunburst',
  //       id: 'echarts-package-size',
  //       radius: ['20%', '90%'],
  //       // animationDurationUpdate: 1000,
  //       // nodeClick: undefined,
  //       data: data,
  //       universalTransition: true,
  //       itemStyle: {
  //         borderWidth: 1,
  //         borderColor: 'rgba(255,255,255,.5)',
  //       },
  //       label: {
  //         // show: false,
  //       },
  //     },
  //   ],
  // };

  const getLabelObj = ({ multiLevel }) => ({
    show: true,

    formatter(params) {
      //   console.log('p', params);
      return [`{name|${params.name}}`, `{tip|${params.data?.tip}}`].join(multiLevel ? '\n' : ' ');
    },
    rich: {
      name: {
        formatSize: 12,
        color: '#fff',
      },
      tip: {
        fontSize: 10,
        // color: '#63709E',
      },
    },
  });

  const labelObj = {
    ...getLabelObj({ multiLevel: true }),
    position: 'insideTopLeft',
  };
  const upperLabelObj = {
    ...getLabelObj({ multiLevel: false }),
    position: 'insideBottomLeft',
  };

  return (
    <div className="flex-1" ref={container}>
      <ReactECharts
        lazyUpdate
        opts={{
          // renderer: 'svg',
          // width: containerHeight.width,
          height: containerHeight.height,
        }}
        key={'1'}
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
          // title: {
          //   text: 'Bundle Size',
          //   left: 'leafDepth',
          // },

          backgroundColor: 'transparent',

          tooltip: {
            formatter(info) {
              const value = formatSize(info.value[0]);
              const treePathInfo = info.treePathInfo;
              const treePath = [];

              for (let i = 1; i < treePathInfo.length; i++) {
                treePath.push(treePathInfo[i].name);
              }

              return [
                '<div class="tooltip-title">' +
                  formatUtil.encodeHTML(treePath.join('/')) +
                  '</div>',
                'Size: ' + value,
                'NM: ' + info.value[1] + ' ' + info.data?.nodeModuleName,
              ].join('');
            },
          },

          series: [
            {
              // roam: 'move',
              name: 'Size Tree',
              type: 'treemap',
              // colorMappingBy: 'value',
              //   colorMappingBy: 'value',
              visualDimension: 1,

              //   color: ['#F7DF1C', '#0085FF', '#FFB200', '#FF0000', '#00CACA', '#FF00FF', '#00FF00'],
              color: new Array(maxNodeModules).fill(null).map((_, index) => {
                // Limit hue to 120-300
                const range = 300 - 120;
                const hue = (index / maxNodeModules) * 360;
                // const range = 300 - 120;
                // const hue = (index / maxNodeModules) * range + 120;

                return saturate(`hsl(${hue}, 50%, 50%)`, 0.5);
              }),
              colorMappingBy: 'value',

              visualMin: 0,
              visualMax: maxNodeModules,
              breadcrumb: {
                show: true,
                height: 30,
                left: 'center',
                top: 'bottom',
                emptyItemWidth: 25,
                // emphasis: {
                //   color: '#313340',
                //   textStyle: {
                //     color: '#63709E',
                //   },
                // },
                itemStyle: {
                  color: '#21222B',

                  borderColor: '#353745',
                  borderWidth: 1,
                  gapWidth: 0,

                  // borderColor: 'transparent',
                  shadowColor: 'transparent',
                  textStyle: {
                    color: '#63709E',
                  },
                },
              },

              // zoomToNodeRatio: 1000,
              leafDepth: 2,
              // visibleMin: 300,

              //   visibleMin: 300,

              upperLabel: {
                show: true,
                height: 30,
                formatter: '{b}',
                ...upperLabelObj,
                emphasis: {
                  ...upperLabelObj,
                },
              },

              itemStyle: {
                borderColor: '#fff',
                shadowColor: 'rgba(0,0,0,0.5)',
                shadowBlur: 0,
                shadowOffsetX: -0.5,
                shadowOffsetY: -0.5,
              },

              label: labelObj,

              levels: [
                {
                  itemStyle: {
                    borderColor: '#777',
                    borderWidth: 0,
                    gapWidth: 1,
                  },
                  upperLabel: {
                    show: false,
                  },
                },
                {
                  itemStyle: {
                    borderColor: '#555',
                    borderWidth: 5,
                    gapWidth: 1,
                  },
                  emphasis: {
                    itemStyle: {
                      borderColor: '#ddd',
                    },
                  },
                },
                ...new Array(maxDepth).fill(null).map((_, index) => ({
                  //   upperLabel: labelObj,
                  colorSaturation: [0.35, 0.5],
                  itemStyle: {
                    borderWidth: 2,

                    // gapWidth: 1,
                    borderColorSaturation: 0.6,
                  },
                })),
              ],

              //   colorSaturation: [0.7, 0.2],
              data,
            },
          ],
        }}
      />
    </div>
  );
}

// import { modifyHSL, modifyAlpha } from 'zrender/src/tool/color';

function saturate(color: string, amount: number) {
  return color;
  // return modifyHSL(color, null, null, amount);
}

const preventDefault = (event: any) => {
  // Replace 'any' with a more specific event type
  event.preventDefault();
};
