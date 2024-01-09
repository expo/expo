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
  sizeString: string;
  ratio: number;
  childCount: number;
  ratioString: string;
  children?: EChartTreeMapDataItem[];
  nodeModuleName: string;
  isNodeModuleRoot?: boolean;
};

const ICON_STRINGS = {
  file: `<svg fill="white" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="24"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>`,
  dir: `<svg fill="white" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="24"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>`,
  pkg: `<svg fill="white" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="24"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z"/></svg>`,
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
    childCount: 0,
    tip: '',
    sizeString: '',
    ratioString: '',
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
          childCount: 0,
          tip: '',
          sizeString: '',
          ratioString: '',
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

    if (hasAmbiguousName) {
      group.nodeModuleName = '';
      group.value[1] = 0; //indexForNodeModule(group.name);
    } else {
      if (hasTopLevelChild || !hasAmbiguousName) {
        group.nodeModuleName = childNames[0];
        group.isNodeModuleRoot = group.nodeModuleName === group.name;
      } else {
        group.nodeModuleName = '';
      }
      group.value[1] = indexForNodeModule(group.nodeModuleName);
    }

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
          const name = child.name + '/' + subChild.name;
          group.children.push({
            ...subChild,
            isNodeModuleRoot: name === subChild.nodeModuleName,
            name: name,
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
    group.ratioString = percetageString;
    group.tip = percetageString + ' (' + size + ')';
    group.sizeString = size;
    group.children.forEach(calculateTooltip);
  };
  calculateTooltip(root);

  const calculateChildCount = (group: EChartTreeMapDataItem): number => {
    group.childCount = group.children.reduce((acc, v) => acc + calculateChildCount(v), 0);
    return group.childCount + (group.children.length ? 0 : 1);
  };
  calculateChildCount(root);

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
      return [
        `{${params.data.isNodeModuleRoot ? 'nameBold' : 'name'}|${params.name}}`,
        `{tip|${params.data?.tip}}`,
      ].join(multiLevel ? '\n' : ' ');
    },
    rich: {
      name: {
        formatSize: 12,
        color: '#fff',
      },
      nameBold: {
        formatSize: 12,
        fontWeight: 'bold',
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
            backgroundColor: '#000',
            // backgroundColor: '#282A35',
            borderWidth: 1,
            borderColor: '#20293A',
            padding: 0,
            textStyle: {
              color: 'white',
            },
            formatter(info) {
              const treePathInfo = info.treePathInfo;
              console.log('treePathInfo', info);
              const treePath = [];

              for (let i = 1; i < treePathInfo.length; i++) {
                treePath.push(treePathInfo[i].name);
              }

              const relativePath = formatUtil.encodeHTML(treePath.join('/'));

              const padding = 8;
              if ('data' in info && info.data?.tip) {
                const { data } = info;
                const components: string[] = [];
                const sideIcon = data.isNodeModuleRoot
                  ? ICON_STRINGS['pkg']
                  : data.moduleHref
                  ? ICON_STRINGS['file']
                  : ICON_STRINGS['dir'];

                components.push(
                  `<div style="padding:0 ${padding}px;display:flex;flex-direction:row;justify-content:space-between;">
                        <div style="display:flex;align-items:center">${sideIcon}
                        <span style="font-weight:${
                          data.isNodeModuleRoot ? 'bold' : 'normal'
                        };padding-right:8px;">${
                          data.isNodeModuleRoot ? info.data.nodeModuleName : info.data.name
                        }</span></div>
                        <span>${info.data.ratioString}</span>
                    </div>`
                );
                const divider = `<span style="width:100%;background-color:#20293A;height:1px"></span>`;
                components.push(divider);

                if (data.childCount) {
                  components.push(
                    `<span style="padding:0 ${padding}px;"><b>Files:</b> ${data.childCount}</span>`
                  );
                }
                components.push(
                  `<span style="padding:0 ${padding}px;"><b>Size:</b> ${info.data.sizeString}</span>`
                );
                components.push(
                  `<span style="padding:0 ${padding}px;opacity: 0.5;"><b>Path:</b> ${relativePath}</span>`
                );
                if (info.data.moduleHref) {
                  components.push(divider);
                  components.push(
                    `<span style="padding:0 ${padding}px;color:#4B86E3"><b>Open File:</b> <kbd>⌘ + Click</kbd></span>`
                  );
                }
                return `<div style="display:flex;flex-direction:column;gap:${padding}px;padding:${padding}px 0;">${components.join(
                  ''
                )}</div>`;
              }

              return '...';
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

              //   zoomToNodeRatio: 0.5,
              //   color: ['#F7DF1C', '#0085FF', '#FFB200', '#FF0000', '#00CACA', '#FF00FF', '#00FF00'],
              color: new Array(maxNodeModules).fill(null).map((_, index) => {
                // Four colors that are easy to distinguish
                const colors = [
                  '#5D4627',
                  '#282A35',
                  '#474036',
                  '#5F562B',
                  '#355431',
                  '#3C5056',
                  '#263C5F',
                  '#313158',
                  '#4A325C',
                  '#5B2B32',
                ];
                return colors[index % colors.length];
                // Limit hue to 120-300
                const range = 300 - 120;
                const next = index % 2 ? -1 : 1;
                const isEven = index % 2 === 0;
                if (isEven) {
                  return '#ff0';
                } else {
                  return '#00ff00';
                }
                const adjusted = index * next;
                // const hue = (adjusted / maxNodeModules) * 360;
                // const range = 300 - 120;
                const hue = (index / maxNodeModules) * range + 120;

                // return '#282A35';
                return saturate(`hsl(${hue}, 50%, 50%)`, 0.5);
              }),
              colorMappingBy: 'value',

              visualMin: 0,
              visualMax: maxNodeModules,
              breadcrumb: {
                show: true,
                height: 36,
                // position: [10, 10],
                left: 8,
                top: 8,
                emptyItemWidth: 25,
                itemStyle: {
                  color: '#000',
                  borderColor: '#20293A',
                  borderWidth: 1,
                  gapWidth: 0,
                  shadowColor: 'transparent',
                  textStyle: {
                    color: '#96A2B5',
                    fontWeight: 'bold',
                  },
                },
                emphasis: {
                  itemStyle: {
                    borderWidth: 2,
                    textStyle: {
                      color: '#fff',
                      fontWeight: 'bold',
                    },
                  },
                },
              },

              // zoomToNodeRatio: 1000,
              // leafDepth: 2,
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
                    borderColor: 'transparent',
                    borderWidth: 0,
                    gapWidth: 4,
                  },
                  upperLabel: {
                    show: false,
                  },
                },
                {
                  itemStyle: {
                    borderColor: '#191A20',
                    borderWidth: 5,
                    gapWidth: 2,
                  },
                  emphasis: {
                    itemStyle: {
                      borderColor: '#25262B',
                    },
                  },
                },
                ...new Array(maxDepth).fill(null).map((_, index) => ({
                  //   upperLabel: labelObj,
                  colorSaturation: [0.35, 0.5],
                  itemStyle: {
                    borderWidth: 2,

                    // gapWidth: 1,
                    borderColorSaturation: 0.4,
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
