import React from 'react';

import { ImageTransition } from '../Image.types';

type Callbacks = {
  onReady?: ((event: React.SyntheticEvent<HTMLImageElement, Event>) => void) | null;
  onAnimationFinished?: ((forceUnmount?: boolean) => void) | null;
  onMount?: (() => void) | null;
};

type AnimationManagerNode = [
  key: string,
  renderFunction: (renderProps: NonNullable<Callbacks>) => (className: string) => React.ReactElement
];

type Animation = null | {
  animateInClass: string;
  animateOutClass: string;
  startingClass: string;
  containerClass: string;
  timingFunction: ImageTransition['timing'];
  animationClass: ImageTransition['effect'];
};

type NodeStatus = 'mounted' | 'in' | 'active' | 'out';

function useAnimationManagerNode(node: AnimationManagerNode | null, initialStatus?: NodeStatus) {
  const newNode = React.useMemo(() => {
    if (!node) {
      return null;
    }
    const [animationKey, renderFunction] = node;
    // key, ReactElement, ref, callbacks
    return {
      animationKey,
      persistedElement: renderFunction,
      status: (initialStatus || 'mounted') as NodeStatus,
    };
  }, [node?.[0]]);
  return newNode;
}

function validateTimingFunctionForAnimation(
  animationClass: ImageTransition['effect'],
  timingFunction: ImageTransition['timing']
) {
  if (animationClass?.includes('flip')) {
    if (timingFunction?.includes('ease')) {
      return 'ease-in-out';
    }
    return 'linear';
  }
  return timingFunction || null;
}

export function getAnimatorFromClass(
  animationClass: ImageTransition['effect'],
  timingFunction: ImageTransition['timing']
) {
  if (!animationClass) return null;
  const timingClass = `image-timing-${validateTimingFunctionForAnimation(
    animationClass,
    timingFunction
  )}`;
  return {
    startingClass: `${animationClass}-start`,
    animateInClass: [animationClass, 'transitioning', `${animationClass}-active`, timingClass].join(
      ' '
    ),
    animateOutClass: [animationClass, `${animationClass}-end`, 'unmount', timingClass].join(' '),
    containerClass: `${animationClass}-container`,
    timingFunction,
    animationClass,
  };
}

type MountedAnimationNode = {
  animationKey: string;
  persistedElement: (renderProps: Callbacks) => (className: string) => React.ReactElement;
  status: 'mounted' | 'in' | 'active' | 'out';
};

export default function AnimationManager({
  children: renderFunction,
  initial,
  animation,
}: {
  children: AnimationManagerNode;
  initial: AnimationManagerNode | null;
  animation: null | Animation;
}) {
  const initialNode = useAnimationManagerNode(initial, 'active');

  const [nodes, setNodes] = React.useState<MountedAnimationNode[]>(
    initialNode ? [initialNode] : []
  );

  const removeAllNodesOfKeyExceptShowing = (key?: string) => {
    setNodes((n) =>
      n.filter(
        (node) =>
          (key ? node.animationKey !== key : false) ||
          node.status === 'in' ||
          node.status === 'active'
      )
    );
  };

  const newNode = useAnimationManagerNode(renderFunction);

  React.useEffect(() => {
    setNodes((n) => {
      if (!newNode) {
        return n;
      }
      const existingNodeIndex = n.findIndex((node) => node.animationKey === newNode.animationKey);
      if (existingNodeIndex >= 0) {
        const copy = [...n];
        copy.splice(existingNodeIndex, 1, newNode);
        return copy;
      }
      return [...n, newNode];
    });
  }, [newNode]);

  function wrapNodeWithCallbacks(node: MountedAnimationNode) {
    if (renderFunction[0] === node.animationKey) {
      return renderFunction[1]({
        onReady: () => {
          if (animation) {
            setNodes((nodes) =>
              nodes.map((n) => (n === newNode ? { ...n, status: 'in' } : { ...n, status: 'out' }))
            );
          } else {
            setNodes([{ ...node, status: 'in' }]);
          }
        },
        onAnimationFinished: () => {
          setNodes([{ ...node, status: 'in' }]);
        },
      });
    }
    if (initial?.[0] === node.animationKey) {
      return initial[1]({
        onAnimationFinished: () => {
          if (node.status === 'out') {
            removeAllNodesOfKeyExceptShowing(node.animationKey);
          }
        },
      });
    }
    return node.persistedElement({
      onAnimationFinished: () => {
        removeAllNodesOfKeyExceptShowing(node.animationKey);
      },
    });
  }

  return (
    <>
      {[...nodes].map((n, idx) => (
        <div className={animation?.containerClass} key={n.animationKey}>
          {wrapNodeWithCallbacks(n)(
            {
              in: animation?.animateInClass,
              out: animation?.animateOutClass,
              mounted: animation?.startingClass,
            }[n.status]
          )}
        </div>
      ))}
    </>
  );
}
