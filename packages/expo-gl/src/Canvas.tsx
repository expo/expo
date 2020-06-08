import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { LayoutChangeEvent, PixelRatio, StyleSheet, View, ViewProps } from 'react-native';

// @ts-ignore
import { createElement } from './createElement';

function getElement(component) {
  try {
    return findDOMNode(component);
  } catch (e) {
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

const Canvas: any = React.forwardRef((props, ref) => createElement('canvas', { ...props, ref }));

const CanvasWrapper: React.FunctionComponent<ViewProps & {
  canvasRef: React.Ref<HTMLCanvasElement>;
}> = ({ pointerEvents, children, ...props }) => {
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  const ref = React.useRef<View>(null);
  const _canvasRef = React.useRef<HTMLCanvasElement>(null);

  function updateCanvasSize(): void {
    const canvas = _canvasRef.current;
    if (canvas) {
      const size = getSize();
      const scale = PixelRatio.get();

      canvas.style.width = `${size.width}px`;
      canvas.style.height = `${size.height}px`;

      canvas.width = size.width * scale;
      canvas.height = size.height * scale;
    }
  }

  function getSize(): { width: number; height: number } {
    if (size) return size;
    if (!ref.current) return { width: 0, height: 0 };
    const element = getElement(ref.current);
    const { offsetWidth: width = 0, offsetHeight: height = 0 } = element;
    return { width, height };
  }

  function onLayout(event: LayoutChangeEvent): void {
    const {
      nativeEvent: {
        layout: { width, height },
      },
    } = event;

    setSize({ width, height });

    if (props.onLayout) {
      props.onLayout(event);
    }
  }

  React.useEffect(() => {
    if (ref.current != null) {
      setSize(getSize());
    }
  }, [ref]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    updateCanvasSize();
  }, [size]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const canvas = _canvasRef.current;
    if (canvas) {
      updateCanvasSize();
    }
    setRef(props.canvasRef, canvas);
  }, [_canvasRef]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View {...props} pointerEvents="box-none" ref={ref} onLayout={onLayout}>
      <Canvas ref={_canvasRef} pointerEvents={pointerEvents} style={StyleSheet.absoluteFill} />
      {children}
    </View>
  );
};

export default CanvasWrapper;
