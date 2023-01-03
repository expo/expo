import React from 'react';

type AnimationManagerNode = [
  key: string,
  renderFunction: (callbacks: {
    onReady: () => void;
    onAnimationFinished: () => void;
    onMount: () => void;
    ref: React.RefObject<HTMLImageElement>;
  }) => React.ReactElement
];

type Animation = null | {
  run: (to: React.RefObject<HTMLImageElement>, from: React.RefObject<HTMLImageElement>[]) => void;
  startingClass: string;
};

function setClassOnElement(element: HTMLImageElement | null, classes: string[]) {
  if (!element) {
    return;
  }
  element.setAttribute('class', classes.join(' '));
}

function useAnimationManagerNode(node: AnimationManagerNode | null) {
  const callbackContainer: {
    onReady: (() => void) | null;
    onAnimationFinished: (() => void) | null;
    onMount: (() => void) | null;
  } = {
    onReady: null,
    onAnimationFinished: null,
    onMount: null,
  };
  const newNode = React.useMemo(() => {
    if (!node) {
      return null;
    }
    const [animationKey, renderFunction] = node;
    const ref = React.createRef<HTMLImageElement>();
    const child = renderFunction({
      onReady: () => {
        callbackContainer.onReady?.();
      },
      onAnimationFinished: () => {
        callbackContainer.onAnimationFinished?.();
      },
      onMount: () => {
        callbackContainer.onMount?.();
      },
      ref,
    });
    // key, ReactElement, ref, callbacks
    return { animationKey, child, ref, callbackContainer };
  }, [node?.[1]]);
  return newNode;
}

export function getAnimatorFromClass(animationClass: string | null) {
  if (!animationClass) return null;

  const runAnimation = (
    to: React.RefObject<HTMLImageElement>,
    from: React.RefObject<HTMLImageElement>[]
  ) => {
    setClassOnElement(to.current, [animationClass, 'transitioning', `${animationClass}-active`]);
    from.forEach((element) => {
      if (!element.current?.classList.contains(`unmount`)) {
        setClassOnElement(element.current, [animationClass, `${animationClass}-end`, 'unmount']);
      }
    });
  };

  return {
    startingClass: `${animationClass}-start`,
    run: runAnimation,
  };
}

type MountedAnimationNode = {
  animationKey: string;
  child: React.ReactElement;
  ref: React.RefObject<HTMLImageElement>;
  callbackContainer: {
    onReady: (() => void) | null;
    onAnimationFinished: ((forceUnmount?: boolean) => void) | null;
    onMount: (() => void) | null;
  };
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
  const initialNode = useAnimationManagerNode(initial);
  if (initialNode) {
    initialNode.callbackContainer.onAnimationFinished = () =>
      setNodes((n) =>
        n.filter(
          (node, index) => node.animationKey !== initialNode.animationKey || index === n.length - 1
        )
      );
  }

  const [nodes, setNodes] = React.useState<MountedAnimationNode[]>(
    initialNode ? [initialNode] : []
  );
  const newNode = useAnimationManagerNode(renderFunction);
  if (newNode) {
    newNode.callbackContainer.onAnimationFinished = (forceUnmount = false) => {
      if (newNode.ref.current?.classList.contains('unmount') || forceUnmount) {
        setNodes((n) =>
          n.filter(
            (node, index) => node.animationKey !== newNode.animationKey || index === n.length - 1
          )
        );
      }
    };
  }
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

      newNode.callbackContainer.onMount = () => {
        if (!newNode?.ref.current || !animation?.startingClass) {
          return;
        }
        if (!newNode?.ref.current.classList.contains('transitioning')) {
          setClassOnElement(newNode?.ref.current, [animation?.startingClass]);
        }
      };

      newNode.callbackContainer.onReady = () => {
        if (animation) {
          animation.run(
            newNode.ref,
            n.map((n2) => n2.ref)
          );
        } else {
          n.forEach((oldNode) => oldNode.callbackContainer?.onAnimationFinished?.(true));
        }
      };
      n.forEach((prevNode) => (prevNode.callbackContainer.onReady = () => null));
      return [...n, newNode];
    });
  }, [newNode]);
  return (
    <>
      {[...nodes].reverse().map((n, idx) => (
        <div key={n.animationKey}>{n.child}</div>
      ))}
    </>
  );
}
