import React, { useMemo, useState, useEffect, useRef } from 'react';
import FoamTree from '@carrotsearch/foamtree';
import { MetroJsonModule } from '../data';
import { useFilteredModules } from '../deps-context';
import { formatSize } from '../data-table';
import classNames from 'classnames';
// import { useWindowDimensions } from 'react-native';

interface TreemapProps {
  data: MetroJsonModule[]; // Replace with a more specific type as per your data structure
  highlightGroups?: Set<any>; // Specify the type for the elements of the Set
  onGroupSecondaryClick?: (event: any) => void; // Replace 'any' with a more specific type
  onGroupHover?: (event: any) => void;
  onMouseLeave?: (event: any) => void;
  onResize?: () => void;
}

type Dataset = {
  label: string;
  absolutePath: string;
  weight: number;
  groups: Dataset[];
  ratio: number;
  tip: string;
};

// Given a list of modules with filepaths `{ absolutePath: string }[]`, create a recursive tree structure of modules `{ absolutePath: string, groups: T[] }[]`
function createModuleTree(paths: MetroJsonModule[]): Dataset[] {
  const root: Dataset = { absolutePath: '/', groups: [], label: '/', weight: 0, ratio: 0, tip: '' };

  paths.forEach((pathObj) => {
    const parts = pathObj.absolutePath.split('/').filter(Boolean);
    let current = root;
    parts.forEach((part, index) => {
      let next = current.groups.find((g) => g.absolutePath === part);

      if (!next) {
        next = { absolutePath: part, label: part, groups: [], weight: 0, ratio: 0, tip: '' };
        current.groups.push(next);
      }

      if (index === parts.length - 1) {
        next.absolutePath = pathObj.absolutePath;
        next.weight = pathObj.size;
      } else {
        next.weight += pathObj.size;
      }

      if (index === parts.length - 1) {
        next.absolutePath = pathObj.absolutePath;
      }

      current = next;
    });
  });

  root.weight = root.groups.reduce((acc, g) => acc + g.weight, 0);

  // Calculate the ratio of each group
  const calculateRatio = (group: Dataset) => {
    group.ratio = group.weight / root.weight;
    group.groups.forEach(calculateRatio);
  };
  calculateRatio(root);

  // Calculate the ratio of each group
  const calculateTooltip = (group: Dataset) => {
    let percentage = group.ratio * 100;
    let percetageString = percentage.toFixed(2) + '%';
    if (percentage <= 0.01) {
      percetageString = '< 0.01%';
    }

    const size = formatSize(group.weight);
    group.tip = percetageString + ' (' + size + ')';
    group.groups.forEach(calculateTooltip);
  };
  calculateTooltip(root);

  return root.groups;
}

export const MetroTreemap: React.FC = () => {
  const [tooltip, setTooltip] = useState<null | {
    content: string;
  }>(null);

  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Follow mouse cursor
    const onMouseMove = (e: MouseEvent) => {
      if (tooltipRef.current) {
        tooltipRef.current.style.left = `${e.clientX + 24}px`;
        tooltipRef.current.style.top = `${e.clientY + 24}px`;
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [tooltipRef]);

  const modules = useFilteredModules();
  const data = useMemo(() => createModuleTree(modules), [modules]);

  return (
    <>
      <Treemap
        data={data}
        className="flex flex-1"
        // highlightGroups={this.highlightedModules}
        // weightProp={store.activeSize}
        // onMouseLeave={this.handleMouseLeaveTreemap}
        onGroupHover={(event) => {
          const { group } = event;
          // console.log('group', group);
          setTooltip({
            content: group.tip,
          });
          // if (group) {
          //   this.setState({
          //     showTooltip: true,
          //     tooltipContent: this.getTooltipContent(group)
          //   });
          // } else {
          //   this.setState({showTooltip: false});
          // }
        }}
        // onGroupSecondaryClick={this.handleTreemapGroupSecondaryClick}
        // onResize={this.handleResize}
      />

      <div
        ref={tooltipRef}
        className={classNames(
          'fixed flex items-center justify-center select-none pointer-events-none',
          !tooltip && 'hidden'
        )}>
        <div className="bg-black p-4 rounded-md shadow-md">{tooltip?.content}</div>
      </div>
    </>
  );
};

export const Treemap: React.FC<TreemapProps> = (props) => {
  const { highlightGroups, data, onGroupSecondaryClick, onGroupHover, onMouseLeave, onResize } =
    props;

  // return null;
  const nodeRef = useRef<HTMLDivElement>(null);
  const treemapRef = useRef<any>(null); // Replace 'any' with a more specific type
  const [zoomOutDisabled, setZoomOutDisabled] = useState(false);
  const [chunkNamePartIndex, setChunkNamePartIndex] = useState(0);

  useEffect(() => {
    if (nodeRef.current) {
      treemapRef.current = createTreemap();
    }

    const resizeListener = () => {
      treemapRef.current?.resize();
      onResize?.();
    };

    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
      treemapRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    // findChunkNamePartIndex();
    treemapRef.current?.set({
      dataObject: { groups: data },
    });
  }, [data]);

  useEffect(() => {
    setTimeout(() => treemapRef.current?.redraw(), 0);
  }, [highlightGroups]);

  // const dims = useWindowDimensions();

  // useEffect(() => {
  //   treemapRef.current?.resize();

  //   if (onResize) {
  //     onResize();
  //   }
  // }, [dims]);

  const getGroupRoot = (group) => {
    let nextParent;
    while (!group.isAsset && (nextParent = treemapRef.current.get('hierarchy', group).parent)) {
      group = nextParent;
    }
    return group;
  };

  const getChunkNamePart = (chunkLabel) => {
    return chunkLabel.split(/[^a-z0-9]/iu)[chunkNamePartIndex] || chunkLabel;
  };

  const createTreemap = () => {
    return new FoamTree({
      element: nodeRef.current,
      layout: 'squarified',
      stacking: 'flattened',
      pixelRatio: window.devicePixelRatio || 1,
      maxGroups: Infinity,
      maxGroupLevelsDrawn: Infinity,
      maxGroupLabelLevelsDrawn: Infinity,
      maxGroupLevelsAttached: Infinity,
      wireframeLabelDrawing: 'always',
      groupMinDiameter: 0,
      groupLabelVerticalPadding: 0.2,
      rolloutDuration: 0,
      pullbackDuration: 0,
      fadeDuration: 0,
      groupExposureZoomMargin: 0.2,
      zoomMouseWheelDuration: 300,
      openCloseDuration: 200,
      dataObject: { groups: data },
      titleBarDecorator(opts, props, vars) {
        vars.titleBarShown = false;
      },
      groupColorDecorator(options, properties, variables) {
        // const root = getGroupRoot(properties.group);
        // const chunkName = getChunkNamePart(root.label);
        // const hash = /[^0-9]/u.test(chunkName)
        //   ? hashCode(chunkName)
        //   : (parseInt(chunkName) / 1000) * 360;
        // variables.groupColor = {
        //   model: 'hsla',
        //   h: Math.round(Math.abs(hash) % 360),
        //   s: 60,
        //   l: 50,
        //   a: 0.9,
        // };
        // const module = properties.group;
        // if (highlightGroups && highlightGroups.has(module)) {
        //   variables.groupColor = {
        //     model: 'rgba',
        //     r: 255,
        //     g: 0,
        //     b: 0,
        //     a: 0.8,
        //   };
        // } else if (highlightGroups && highlightGroups.size > 0) {
        //   // this means a search (e.g.) is active, but this module
        //   // does not match; gray it out
        //   // https://github.com/webpack-contrib/webpack-bundle-analyzer/issues/553
        //   variables.groupColor.s = 10;
        // }
      },
      /**
       * Handle Foamtree's "group clicked" event
       * @param {FoamtreeEvent} event - Foamtree event object
       *  (see https://get.carrotsearch.com/foamtree/demo/api/index.html#event-details)
       * @returns {void}
       */
      onGroupClick(event) {
        preventDefault(event);
        if ((event.ctrlKey || event.secondary) && onGroupSecondaryClick) {
          onGroupSecondaryClick(event);
          return;
        }

        setZoomOutDisabled(false);
        this.zoom(event.group);
      },
      onGroupDoubleClick: preventDefault,
      onGroupHover(event) {
        // Ignoring hovering on `FoamTree` branding group and the root group
        if (event.group && (event.group.attribution || event.group === this.get('dataObject'))) {
          event.preventDefault();
          if (onMouseLeave) {
            onMouseLeave(event);
          }
          return;
        }

        if (onGroupHover) {
          onGroupHover(event);
        }
      },
      onGroupMouseWheel(event) {
        const { scale } = this.get('viewport');
        const isZoomOut = event.delta < 0;

        if (isZoomOut) {
          if (zoomOutDisabled) return preventDefault(event);
          if (scale < 1) {
            setZoomOutDisabled(true);
            preventDefault(event);
          }
        } else {
          setZoomOutDisabled(false);
        }
      },
    });
  };

  const findChunkNamePartIndex = () => {
    const splitChunkNames = data.map((chunk) => chunk.label.split(/[^a-z0-9]/iu));
    const longestSplitName = Math.max(...splitChunkNames.map((parts) => parts.length));
    const namePart = {
      index: 0,
      votes: 0,
    };
    for (let i = longestSplitName - 1; i >= 0; i--) {
      const identifierVotes = {
        name: 0,
        hash: 0,
        ext: 0,
      };
      let lastChunkPart = '';
      for (const splitChunkName of splitChunkNames) {
        const part = splitChunkName[i];
        if (part === undefined || part === '') {
          continue;
        }
        if (part === lastChunkPart) {
          identifierVotes.ext++;
        } else if (
          /[a-z]/u.test(part) &&
          /[0-9]/u.test(part) &&
          part.length === lastChunkPart.length
        ) {
          identifierVotes.hash++;
        } else if (/^[a-z]+$/iu.test(part) || /^[0-9]+$/u.test(part)) {
          identifierVotes.name++;
        }
        lastChunkPart = part;
      }
      if (identifierVotes.name >= namePart.votes) {
        namePart.index = i;
        namePart.votes = identifierVotes.name;
      }
    }
    // this.chunkNamePartIndex = namePart.index;
    setChunkNamePartIndex(namePart.index);
  };

  // Define other utility functions like createTreemap, findChunkNamePartIndex, etc., here

  const jsx = useMemo(() => <div {...props} ref={nodeRef} />, []);
  return jsx;
};

export default Treemap;

const preventDefault = (event: any) => {
  // Replace 'any' with a more specific event type
  event.preventDefault();
};

const hashCode = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    hash = (hash << 5) - hash + code;
    hash &= hash; // Convert to 32bit integer
  }
  return hash;
};
