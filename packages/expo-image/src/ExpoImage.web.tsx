import React from 'react';

import {
  ImageContentPositionObject,
  ImageContentPositionValue,
  ImageNativeProps,
  ImageProps,
  ImageSource,
  ImageLoadEventData,
} from './Image.types';
import { useBlurhash } from './utils/blurhash/useBlurhash';
import { isBlurhashString } from './utils/resolveSources';

function ensureUnit(value: string | number) {
  const trimmedValue = String(value).trim();
  if (trimmedValue.endsWith('%')) {
    return trimmedValue;
  }
  return `${trimmedValue}px`;
}

type KeysOfUnion<T> = T extends T ? keyof T : never;

function getObjectPositionFromContentPositionObject(
  contentPosition?: ImageContentPositionObject
): string {
  const resolvedPosition = { ...contentPosition } as Record<
    KeysOfUnion<ImageContentPositionObject>,
    ImageContentPositionValue
  >;
  if (!resolvedPosition) {
    return '50% 50%';
  }
  if (resolvedPosition.top == null && resolvedPosition.bottom == null) {
    resolvedPosition.top = '50%';
  }
  if (resolvedPosition.left == null && resolvedPosition.right == null) {
    resolvedPosition.left = '50%';
  }

  return (
    ['top', 'bottom', 'left', 'right']
      .map((key) => {
        if (key in resolvedPosition) {
          return `${key} ${ensureUnit(resolvedPosition[key])}`;
        }
        return '';
      })
      .join(' ') || '50% 50%'
  );
}

function findBestSourceForSize(
  sources: ImageSource[] | undefined,
  size: DOMRect | null
): ImageSource | null {
  return (
    [...(sources || [])]
      // look for the smallest image that's still larger then a container
      ?.map((source) => {
        if (!size) {
          return { source, penalty: 0, covers: false };
        }
        const { width, height } =
          typeof source === 'object' ? source : { width: null, height: null };
        if (width == null || height == null) {
          return { source, penalty: 0, covers: false };
        }
        if (width < size.width || height < size.height) {
          return {
            source,
            penalty: Math.max(size.width - width, size.height - height),
            covers: false,
          };
        }
        return { source, penalty: (width - size.width) * (height - size.height), covers: true };
      })
      .sort((a, b) => a.penalty - b.penalty)
      .sort((a, b) => Number(b.covers) - Number(a.covers))[0]?.source ?? null
  );
}

function useSourceSelection(
  sources?: ImageSource[],
  sizeCalculation: ImageProps['responsivePolicy'] = 'live'
) {
  const hasMoreThanOneSource = (sources?.length ?? 0) > 1;

  // null - not calculated yet, DOMRect - size available
  const [size, setSize] = React.useState<null | DOMRect>(null);
  const resizeObserver = React.useRef<ResizeObserver | null>(null);

  React.useEffect(() => {
    return () => {
      resizeObserver.current?.disconnect();
    };
  }, []);

  const containerRef = React.useCallback(
    (element: HTMLDivElement) => {
      if (!hasMoreThanOneSource) {
        return;
      }
      setSize(element?.getBoundingClientRect());
      if (sizeCalculation === 'live') {
        resizeObserver.current?.disconnect();
        if (!element) {
          return;
        }
        resizeObserver.current = new ResizeObserver((entries) => {
          setSize(entries[0].contentRect);
        });
        resizeObserver.current.observe(element);
      }
    },
    [hasMoreThanOneSource, sizeCalculation]
  );

  const bestSourceForSize = size !== undefined ? findBestSourceForSize(sources, size) : null;
  const source = (hasMoreThanOneSource ? bestSourceForSize : sources?.[0]) ?? null;

  return React.useMemo(
    () => ({
      containerRef,
      source,
    }),
    [source]
  );
}

function getFetchPriorityFromImagePriority(priority: ImageNativeProps['priority'] = 'normal') {
  return priority && ['low', 'high'].includes(priority) ? priority : 'auto';
}

function setClassOnElement(element: HTMLImageElement | null, classes: string[]) {
  if (!element) {
    return;
  }
  element.setAttribute('class', classes.join(' '));
}

function getAnimatorFromClass(animationClass: string | null) {
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

const Image = React.forwardRef(
  (
    {
      source,
      events,
      contentPosition,
      blurhashContentPosition,
      priority,
      style,
      blurhashStyle,
      className,
    }: {
      source?: ImageSource | null;
      events?: {
        onLoad?: (((event: React.SyntheticEvent<HTMLImageElement, Event>) => void) | undefined)[];
        onError?: ((({ source }: { source: ImageSource | null }) => void) | undefined)[];
        onTransitionEnd?: ((() => void) | undefined)[];
        onMount?: ((() => void) | undefined)[];
      };
      contentPosition?: ImageContentPositionObject;
      blurhashContentPosition?: ImageContentPositionObject;
      priority?: string | null;
      style: React.CSSProperties;
      blurhashStyle?: React.CSSProperties;
      className?: string;
    },
    ref: React.Ref<HTMLImageElement>
  ) => {
    React.useEffect(() => {
      events?.onMount?.forEach((e) => e?.());
    }, []);

    const isBlurhash = isBlurhashString(source?.uri || '');
    const blurhashUri = useBlurhash(isBlurhash ? source?.uri : null, source?.width, source?.height);
    const objectPosition = getObjectPositionFromContentPositionObject(
      isBlurhash ? blurhashContentPosition : contentPosition
    );
    const uri = isBlurhash ? blurhashUri : source?.uri;

    return (
      <img
        ref={ref}
        className={className}
        src={uri || undefined}
        key={source?.uri}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          left: 0,
          right: 0,
          objectPosition,
          ...style,
          ...(isBlurhash ? blurhashStyle : {}),
        }}
        // @ts-ignore
        // eslint-disable-next-line react/no-unknown-property
        fetchpriority={getFetchPriorityFromImagePriority(priority || 'normal')}
        onLoad={(event) => {
          events?.onLoad?.forEach((e) => e?.(event));
        }}
        onTransitionEnd={() => events?.onTransitionEnd?.forEach((e) => e?.())}
        onError={() => events?.onError?.forEach((e) => e?.({ source: source || null }))}
      />
    );
  }
);

function onLoadAdapter(onLoad?: (event: ImageLoadEventData) => void) {
  return (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = event.target as HTMLImageElement;
    onLoad?.({
      source: {
        url: target.currentSrc,
        width: target.naturalWidth,
        height: target.naturalHeight,
        mediaType: null,
      },
      cacheType: 'none',
    });
  };
}

function onErrorAdapter(onError?: { (event: { error: string }): void }) {
  return ({ source }: { source?: ImageSource | null }) => {
    onError?.({
      error: `Failed to load image from url: ${source?.uri}`,
    });
  };
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
    console.log({ node });
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

function AnimationManager({
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
        setClassOnElement(newNode?.[2].current, [animation?.startingClass]);
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

export default function ExpoImage({
  source,
  placeholder,
  contentFit,
  contentPosition,
  onLoad,
  transition,
  onError,
  responsivePolicy,
  onLoadEnd,
  priority,
  ...props
}: ImageNativeProps) {
  const { aspectRatio, backgroundColor, transform, borderColor, ...style } = props.style ?? {};
  const { containerRef, source: selectedSource } = useSourceSelection(source, responsivePolicy);
  const animation =
    (transition?.duration || -1) > 0 ? getAnimatorFromClass(transition?.effect || null) : null;
  return (
    <div
      ref={containerRef}
      style={{
        aspectRatio: String(aspectRatio),
        backgroundColor: backgroundColor?.toString(),
        transform: transform?.toString(),
        borderColor: borderColor?.toString(),
        ...style,
        overflow: 'hidden',
        position: 'relative',
      }}>
      <style>
        {`
        .cross-dissolve {
          transition-property: opacity;
          animation-fill-mode: forwards;
        }
        .cross-dissolve-start:not(.transitioning) {
          opacity: 0;
        }
        .cross-dissolve-active {
          opacity: 1;
        }
        .cross-dissolve-end {
          opacity: 0;
        }
        .flip-from-top {
          transition-property: transform;
          animation-fill-mode: forwards;
          transform-origin: top;
        }
        .flip-from-top-start:not(.transitioning) {
          transform: rotateX(90deg);
        }
        .flip-from-top-active {
          transform: rotateX(0);
        }
        .flip-from-top-end {
          transform: rotateX(-90deg);
        }
          `}
      </style>
      <AnimationManager
        animation={animation}
        initial={
          placeholder?.[0]?.uri
            ? [
                placeholder?.[0]?.uri || '',
                ({ onAnimationFinished, ref }) => (
                  <Image
                    ref={ref}
                    source={placeholder?.[0]}
                    style={{
                      objectFit: 'scale-down',
                    }}
                    events={{
                      onTransitionEnd: [onAnimationFinished],
                    }}
                    contentPosition={{ left: '50%', top: '50%' }}
                    blurhashContentPosition={contentPosition}
                    blurhashStyle={{
                      objectFit: contentFit,
                    }}
                  />
                ),
              ]
            : null
        }>
        {[
          (selectedSource as any)?.uri,
          ({ onAnimationFinished, onReady, ref, onMount }) => (
            <Image
              ref={ref}
              source={selectedSource || placeholder?.[0]}
              events={{
                onError: [onErrorAdapter(onError), onLoadEnd],
                onLoad: [onLoadAdapter(onLoad), onLoadEnd, onReady],
                onMount: [onMount],
                onTransitionEnd: [onAnimationFinished],
              }}
              style={{
                objectFit: selectedSource ? contentFit : 'scale-down',
                transitionDuration: `${transition?.duration || 0}ms`,
              }}
              priority={priority}
              contentPosition={selectedSource ? contentPosition : { top: '50%', left: '50%' }}
            />
          ),
        ]}
      </AnimationManager>
    </div>
  );
}
