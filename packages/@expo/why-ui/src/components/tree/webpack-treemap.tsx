import FoamTree from '@carrotsearch/foamtree';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { MetroJsonModule } from '../data';
import { formatSize } from '../data-table';
import { useFilteredModules } from '../deps-context';
import { Tooltip } from './tooltip';
import { router } from 'expo-router';

interface TreemapProps {
  data: Dataset[]; // Replace with a more specific type as per your data structure
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
  moduleHref?: string;
};

// Given a list of modules with filepaths `{ absolutePath: string }[]`, create a recursive tree structure of modules `{ absolutePath: string, groups: T[] }[]`
function createModuleTree(paths: MetroJsonModule[]): Dataset[] {
  const root: Dataset = { absolutePath: '/', groups: [], label: '/', weight: 0, ratio: 0, tip: '' };

  paths.forEach((pathObj) => {
    const parts = pathObj.absolutePath.split('/').filter(Boolean);
    let current = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      let next = current.groups.find((g) => g.absolutePath === part);

      if (!next) {
        next = { absolutePath: part, label: part, groups: [], weight: 0, ratio: 0, tip: '' };
        current.groups.push(next);
      }

      if (isLast) {
        next.absolutePath = pathObj.absolutePath;
        next.moduleHref = pathObj.path;
        next.weight = pathObj.size;
      } else {
        next.weight += pathObj.size;
      }

      current = next;
    });
  });

  const foldSingleChildGroups = (group: Dataset) => {
    if (group.groups.length === 1) {
      const child = group.groups[0];
      group.weight = child.weight;
      group.label = group.label + '/' + child.label;
      group.absolutePath = child.absolutePath;
      group.groups = child.groups;
      group.moduleHref = child.moduleHref;

      foldSingleChildGroups(group); // recursively fold single child groups
    } else {
      group.groups.forEach(foldSingleChildGroups);
    }
  };
  foldSingleChildGroups(root);

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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export const MetroTreemap: React.FC = () => {
  const [tooltip, setTooltip] = useState<null | {
    content: string;
  }>(null);
  const [contextMenuGroup, setContextMenuGroup] = useState<null | Dataset>(null);

  const modules = useFilteredModules();
  const data = useMemo(
    () =>
      createModuleTree(
        modules.filter((v) =>
          // Remove non-standard modules to prevent shifting the weight scales
          v.absolutePath.startsWith('/')
        )
      ),
    [modules]
  );

  const tree = useMemo(
    () => (
      <Treemap
        data={data}
        className="flex flex-1"
        onGroupHover={(event) => {
          const { group } = event;
          setTooltip({
            content: group.tip,
          });
        }}
        onGroupSecondaryClick={(event) => {
          const { group } = event;
          console.log('open:', group.moduleHref);
          setContextMenuGroup(group);
          event.preventDefault();
          router.push({
            pathname: '/module/[id]',
            params: { id: group.moduleHref },
          });
        }}
      />
    ),
    [data]
  );
  return (
    <div className="flex flex-1">
      {/* <ContextMenu
        modal
        onOpenChange={(open) => {
          if (!open) {
            console.log('invalidate');
            setContextMenuGroup(null);
          }
        }}> */}
      {tree}

      {/* <ContextMenuContent forceMount={true}>
          <ContextMenuItem disabled={!contextMenuGroup?.moduleHref}>Inspect</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu> */}

      <Tooltip visible={!!tooltip}>{tooltip?.content}</Tooltip>
    </div>
  );
};

export const Treemap: React.FC<TreemapProps> = (props) => {
  const { highlightGroups, data, onGroupSecondaryClick, onGroupHover, onMouseLeave, onResize } =
    props;

  // return null;
  const nodeRef = useRef<HTMLDivElement>(null);
  const treemapRef = useRef<any>(null); // Replace 'any' with a more specific type
  const zoomOutDisabled = useRef(false);

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
    treemapRef.current?.set({
      dataObject: { groups: data },
    });
  }, [data]);

  useEffect(() => {
    setTimeout(() => treemapRef.current?.redraw(), 0);
  }, [highlightGroups]);

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
        variables.labelColor = '#fff';
        variables.groupColor = {
          model: 'hsla',
          h: 0,
          s: 0,
          l: 20,
          a: 0.9,
        };
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

        zoomOutDisabled.current = false;

        this.zoom(event.group);
      },
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
      onGroupDoubleClick: preventDefault,
      onGroupMouseWheel(event) {
        const { scale } = this.get('viewport');
        const isZoomOut = event.delta < 0;

        if (isZoomOut) {
          if (zoomOutDisabled.current) return preventDefault(event);
          if (scale < 1) {
            zoomOutDisabled.current = true;

            preventDefault(event);
          }
        } else {
          zoomOutDisabled.current = false;
        }
      },
    });
  };

  const jsx = useMemo(() => <div className="flex flex-1" ref={nodeRef} />, []);
  return jsx;
};

export default Treemap;

const preventDefault = (event: any) => {
  // Replace 'any' with a more specific event type
  event.preventDefault();
};
