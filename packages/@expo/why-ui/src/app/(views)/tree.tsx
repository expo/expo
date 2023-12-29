import { MetroJsonModule } from '@/components/data';

import { useFilteredModules, useGraph } from '@/components/deps-context';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDynamicHeight } from '@/components/useDynamicHeight';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { formatSize } from '@/components/table';
import { useRouter } from 'expo-router';

// Given a list of modules with filepaths `{ absolutePath: string }[]`, create a recursive tree structure of modules `{ absolutePath: string, groups: T[] }[]`
function createModuleTree(paths: MetroJsonModule[]): {
  data: EChartTreeMapDataItem[];
  maxDepth: number;
} {
  const root: EChartTreeMapDataItem = {
    path: '/',
    children: [],
    name: '/',
    value: 0,
    ratio: 0,
    tip: '',
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
        next = { path: part, name: part, children: [], value: 0, ratio: 0, tip: '' };
        current.children.push(next);
      }

      if (isLast) {
        next.path = pathObj.absolutePath;
        next.moduleHref = pathObj.id;
        next.value = pathObj.size;
      } else {
        next.value += pathObj.size;
      }

      current = next;
    });
  });

  const foldSingleChildGroups = (group: EChartTreeMapDataItem) => {
    if (group.children.length === 1) {
      const child = group.children[0];
      group.value = child.value;
      group.name = group.name + '/' + child.name;
      group.path = child.path;
      group.children = child.children;
      group.moduleHref = child.moduleHref;

      foldSingleChildGroups(group); // recursively fold single child children
    } else {
      group.children.forEach(foldSingleChildGroups);
    }
  };
  foldSingleChildGroups(root);

  root.value = root.children.reduce((acc, g) => acc + g.value, 0);

  // Calculate the ratio of each group
  const calculateRatio = (group: EChartTreeMapDataItem) => {
    group.ratio = group.value / root.value;
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

    const size = formatSize(group.value);
    group.tip = percetageString + ' (' + size + ')';
    group.children.forEach(calculateTooltip);
  };
  calculateTooltip(root);

  return { data: root.children, maxDepth };
}

export default function Treemap() {
  const modules = useFilteredModules();
  const router = useRouter();
  const graph = useGraph();

  // const data = [
  //   {
  //     value: 10,
  //     name: 'WidgetResources',
  //     path: 'WidgetResources',
  //     children: [
  //       {
  //         value: 16,
  //         name: '.parsers',
  //         path: 'WidgetResources/.parsers',
  //       },
  //       {
  //         value: 172,
  //         name: 'AppleClasses',
  //         path: 'WidgetResources/AppleClasses',
  //         children: [
  //           {
  //             value: 1,
  //             name: 'Images',
  //             path: 'WidgetResources/AppleClasses/Images',
  //           },
  //           {
  //             value: 20,
  //             name: 'Images',
  //             path: 'WidgetResources/AppleClasses/Images',
  //             children: [
  //               {
  //                 value: 10,
  //                 name: 'Images3',
  //                 path: 'WidgetResources/AppleClasses/Images2',
  //               },
  //               {
  //                 value: 3,
  //                 name: 'Images2',
  //                 path: 'WidgetResources/AppleClasses/Images3',
  //               },
  //             ],
  //           },
  //         ],
  //       },
  //       {
  //         value: 0,
  //         name: 'AppleParser',
  //         path: 'WidgetResources/AppleParser',
  //       },
  //       {
  //         value: 48,
  //         name: 'button',
  //         path: 'WidgetResources/button',
  //       },
  //       {
  //         value: 32,
  //         name: 'ibutton',
  //         path: 'WidgetResources/ibutton',
  //       },
  //     ],
  //   },
  // ];
  const { data, maxDepth } = useMemo(
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

  function getLevelOption() {
    // return [
    //   {
    //     itemStyle: {
    //       borderWidth: 0,
    //       gapWidth: 5,
    //     },
    //   },
    // ];
    return [
      // {
      //   itemStyle: {
      //     borderWidth: 3,
      //     borderColor: '#333',
      //     gapWidth: 3,
      //   },
      // },
      // {},
      // // {
      // //   color: ['#942e38', '#aaa', '#269f3c'],
      // //   colorMappingBy: 'value',
      // //   itemStyle: {
      // //     gapWidth: 1,
      // //   },
      // // },
      // // {
      // //   itemStyle: {
      // //     borderColor: '#777',
      // //     borderWidth: 0,
      // //     gapWidth: 1,
      // //   },
      // //   upperLabel: {
      // //     show: false,
      // //   },
      // // },
      // {
      //   upperLabel: {
      //     show: false,
      //   },
      //   itemStyle: {
      //     borderColor: '#555',
      //     borderWidth: 5,
      //     gapWidth: 1,
      //   },
      //   emphasis: {
      //     itemStyle: {
      //       borderColor: '#ddd',
      //     },
      //   },
      // },
      // {
      //   label: {
      //     show: true,
      //     formatter: '{b}',
      //   },
      //   upperLabel: {
      //     show: true,
      //     height: 30,
      //   },
      //   // colorSaturation: [0.35, 0.5],
      //   itemStyle: {
      //     borderWidth: 5,
      //     gapWidth: 1,
      //     borderColorSaturation: 0.6,
      //   },
      // },
    ];
  }

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

  return (
    <div className="flex-1" ref={container}>
      <ReactECharts
        lazyUpdate
        opts={{
          // renderer: 'svg',
          // width: containerHeight.width,
          height: containerHeight.height,
        }}
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
          title: {
            text: 'Bundle Size',
            subtext: graph.transformOptions.platform,
            left: 'leafDepth',
          },

          backgroundColor: 'transparent',

          tooltip: {
            formatter(info) {
              const value = formatSize(info.value);
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
              ].join('');
            },
          },

          series: [
            {
              roam: 'move',
              name: 'Size Tree',
              type: 'treemap',
              colorMappingBy: 'value',
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

                  borderColor: 'transparent',
                  shadowColor: 'transparent',
                  textStyle: {
                    color: '#63709E',
                  },
                },
              },
              // zoomToNodeRatio: 1000,
              // leafDepth: 3,
              // visibleMin: 300,

              label: {
                show: true,
                // formatter: '{b}',

                // normal: {
                //   textStyle: {
                //     ellipsis: true,
                //   },
                // },
              },
              upperLabel: {
                show: true,
                position: 'insideTop',
                distance: 10,
                emphasis: {
                  position: 'insideTop',
                  distance: 10,
                },
              },

              levels: new Array(maxDepth).fill({}).map((_, index) => {
                return {
                  itemStyle: {
                    // borderColorSaturation: 0.1,
                    borderColor: saturate('#353745', index / maxDepth),
                    borderWidth: 1,
                    gapWidth: 0,
                    color: '#030816',
                    // color: ['#942e38', '#aaa', '#269f3c'],
                    // colorMappingBy: 'value',
                  },

                  upperLabel: {
                    show: true,
                    position: 'insideTop',
                    distance: 10,
                    fontSize: 16,
                    emphasis: {
                      position: 'insideTop',
                      distance: 10,
                    },
                  },

                  // label: {
                  //   show: index === maxDepth - 1,
                  //   formatter: '{b}',
                  // },
                  // upperLabel: {
                  //   show: index === maxDepth - 1,
                  //   height: 30,
                  // },
                };
              }),

              // itemStyle: {
              //   borderColorSaturation: 0.3,
              //   // borderColorSaturation: 0.3,
              //   borderColor: '#000',
              //   borderWidth: 1,
              //   gapWidth: 0,
              // },
              colorSaturation: [0.2, 0.7],
              // levels: [
              //   {},
              //   {
              //     colorSaturation: [0.3, 0.6],
              //     itemStyle: {
              //       borderColorSaturation: 0.3,
              //       borderColor: '#000',
              //       borderWidth: 1,
              //       gapWidth: 0,
              //     },
              //   },
              //   {
              //     colorSaturation: [0.3, 0.6],
              //     itemStyle: {
              //       borderColorSaturation: 0.3,
              //       borderColor: '#000',
              //       borderWidth: 1,
              //       gapWidth: 0,
              //     },
              //   },
              // ],
              // levels: getLevelOption(),
              data,
            },
          ],
        }}
      />
    </div>
  );
}

import { modifyHSL, modifyAlpha } from 'zrender/src/tool/color';

function saturate(color: string, amount: number) {
  return modifyHSL(color, null, null, amount);
}

type EChartTreeMapDataItem = {
  name: string;
  path: string;
  value: number;
  moduleHref?: string;
  tip: string;
  ratio: number;
  children?: EChartTreeMapDataItem[];
};

const preventDefault = (event: any) => {
  // Replace 'any' with a more specific event type
  event.preventDefault();
};
