import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { LayoutChangeEvent, PixelRatio, StyleSheet, View, ViewProps } from 'react-native';
import createElement from 'react-native-web/dist/exports/createElement';

interface Size {
  width: number;
  height: number;
}

interface GetSizeParams {
  size: Size | null;
  ref: React.RefObject<View | null>;
}

function getElement(component: React.ReactInstance): React.ReactInstance | Element | null | Text {
  try {
    return findDOMNode(component);
  } catch {
    return component;
  }
}

function setRef<T>(refProp: React.Ref<T>, ref: T | null) {
  if (!refProp) return;

  if (typeof refProp === 'function') {
    refProp(ref);
  } else if ('current' in refProp) {
    // @ts-ignore
    refProp.current = ref;
  }
}

function getSize({ size, ref }: GetSizeParams): Size {
  if (size) {
    return size;
  } else if (!ref.current || typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  const element = getElement(ref.current);
  const { offsetWidth: width = 0, offsetHeight: height = 0 } = element as HTMLElement;
  return { width, height };
}

const Canvas = React.forwardRef(
  (props: React.ComponentProps<typeof View>, ref: React.Ref<HTMLCanvasElement>) =>
    createElement('canvas', { ...props, ref })
);

const CanvasWrapper: React.FunctionComponent<
  ViewProps & {
    canvasRef: React.Ref<HTMLCanvasElement>;
  }
> = ({ pointerEvents, children, style, ...props }) => {
  const [size, setSize] = React.useState<Size | null>(null);

  const ref = React.useRef<View>(null);
  const _canvasRef = React.useRef<HTMLCanvasElement>(null);

  const updateCanvasSize = React.useCallback(() => {
    const canvas = _canvasRef.current;
    if (typeof HTMLCanvasElement !== 'undefined' && canvas instanceof HTMLCanvasElement) {
      const currentSize = getSize({
        size,
        ref,
      });
      const scale = PixelRatio.get();

      canvas.style.width = `${currentSize.width}px`;
      canvas.style.height = `${currentSize.height}px`;

      canvas.width = currentSize.width * scale;
      canvas.height = currentSize.height * scale;
    }
  }, [size?.width, size?.height]);

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const {
        nativeEvent: {
          layout: { width, height },
        },
      } = event;

      if (width !== size?.width || height !== size?.height) {
        setSize({ width, height });

        if (props.onLayout) {
          props.onLayout(event);
        }
      }
    },
    [size?.width, size?.height, props.onLayout]
  );

  React.useEffect(() => {
    if (ref.current != null) {
      setSize(getSize({ size, ref }));
    }
  }, [ref]);

  React.useEffect(() => {
    updateCanvasSize();
  }, [size]);

  React.useEffect(() => {
    const canvas = _canvasRef.current;
    if (canvas) {
      updateCanvasSize();
    }
    setRef(props.canvasRef, canvas);
  }, [_canvasRef]);

  return (
    <View {...props} style={[styles.wrapper, style]} ref={ref} onLayout={onLayout}>
      <Canvas ref={_canvasRef} pointerEvents={pointerEvents} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    pointerEvents: 'box-none',
  },
});

export default CanvasWrapper;
