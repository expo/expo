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
    return [animationKey, child, ref, callbackContainer] as [
      string,
      React.ReactElement,
      React.RefObject<HTMLImageElement>,
      typeof callbackContainer
    ];
  }, [node?.[1]]);
  return newNode;
}

export function getAnimatorFromClass(animationClass: string | null) {
  if (!animationClass) return null;
  return {
    startingClass: `${animationClass}-start`,
    run: (to: React.RefObject<HTMLImageElement>, from: React.RefObject<HTMLImageElement>[]) => {
      setClassOnElement(to.current, [animationClass, 'transitioning', `${animationClass}-active`]);
      from.forEach((element) => {
        if (!element.current?.classList.contains(`unmount`)) {
          setClassOnElement(element.current, [animationClass, `${animationClass}-end`, 'unmount']);
        }
      });
    },
  };
}

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
    initialNode[3].onAnimationFinished = () =>
      setNodes((n) =>
        n.filter((node, index) => node[0] !== initialNode[0] || index === n.length - 1)
      );
  }

  const [nodes, setNodes] = React.useState<
    [
      string,
      React.ReactElement,
      React.RefObject<HTMLImageElement>,
      {
        onReady: (() => void) | null;
        onAnimationFinished: ((forceUnmount?: boolean) => void) | null;
        onMount: (() => void) | null;
      }
    ][]
  >(initialNode ? [initialNode] : []);
  const newNode = useAnimationManagerNode(renderFunction);
  if (newNode) {
    newNode[3].onAnimationFinished = (forceUnmount = false) => {
      if (newNode[2].current?.classList.contains('unmount') || forceUnmount) {
        setNodes((n) =>
          n.filter((node, index) => node[0] !== newNode[0] || index === n.length - 1)
        );
      }
    };
  }
  React.useEffect(() => {
    setNodes((n) => {
      if (!newNode) {
        return n;
      }
      const existingNodeIndex = n.findIndex((node) => node[0] === newNode[0]);
      if (existingNodeIndex >= 0) {
        const copy = [...n];
        copy.splice(existingNodeIndex, 1, newNode);
        return copy;
      }

      newNode[3].onMount = () => {
        if (!newNode?.[2].current || !animation?.startingClass) {
          return;
        }
        if (!newNode?.[2].current.classList.contains('transitioning')) {
          setClassOnElement(newNode?.[2].current, [animation?.startingClass]);
        }
      };

      newNode[3].onReady = () => {
        if (animation) {
          animation.run(
            newNode[2],
            n.map((n2) => n2[2])
          );
        } else {
          n.forEach((oldNode) => oldNode[3]?.onAnimationFinished?.(true));
        }
      };
      n.forEach((prevNode) => (prevNode[3].onReady = () => null));
      return [...n, newNode];
    });
  }, [newNode]);
  return (
    <>
      {[...nodes].reverse().map((n, idx) => (
        <div key={n[0]}>{n[1]}</div>
      ))}
    </>
  );
}
