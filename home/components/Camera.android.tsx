import { Camera as OriginalCamera } from 'expo-camera';
import React, { useCallback, useState, useEffect } from 'react';
import { Dimensions, View } from 'react-native';

type AspectRatio = string[];
type CameraRef = OriginalCamera;
type CameraRefCallback = (node: CameraRef) => void;

function useSupportedAspectRatios(): [AspectRatio | null, CameraRefCallback] {
  const [aspectRatios, setAspectRatios] = useState<string[] | null>(null);

  const ref = useCallback(
    (node: CameraRef | null) => {
      async function getSupportedAspectRatiosAsync(node: OriginalCamera) {
        try {
          const result = await node.getSupportedRatiosAsync();
          setAspectRatios(result);
        } catch (e) {}
      }

      if (node !== null) {
        getSupportedAspectRatiosAsync(node!);
      }
    },
    [setAspectRatios]
  );

  return [aspectRatios, ref];
}

const DEFAULT_DIMENSIONS = {
  width: Dimensions.get('window').width,
  height: Dimensions.get('window').height,
};

type DimensionsResult = { width: number; height: number };

const useComponentDimensions = (): [DimensionsResult, any] => {
  const [dimensions, setDimensions] = useState<DimensionsResult>(DEFAULT_DIMENSIONS);

  const onLayout = useCallback(
    event => {
      const { width, height } = event.nativeEvent.layout;
      setDimensions({ width, height });
    },
    [setDimensions]
  );

  return [dimensions, onLayout];
};

function ratioStringToNumber(ratioString: string) {
  const [a, b] = ratioString.split(':');
  return parseInt(a, 10) / parseInt(b, 10);
}

function findClosestAspectRatio(
  supportedAspectRatios: string[] | null,
  dimensions: DimensionsResult
) {
  if (!supportedAspectRatios) {
    return undefined;
  }

  const dimensionsRatio =
    Math.max(dimensions.height, dimensions.width) / Math.min(dimensions.height, dimensions.width);

  const aspectRatios = [...supportedAspectRatios];
  aspectRatios.sort((a: string, b: string) => {
    let ratioA = ratioStringToNumber(a);
    let ratioB = ratioStringToNumber(b);
    return Math.abs(dimensionsRatio - ratioA) - Math.abs(dimensionsRatio - ratioB);
  });

  return aspectRatios[0];
}

function calculateSuggestedDimensions(dimensions: DimensionsResult, ratio?: string) {
  if (!ratio) {
    return null;
  }

  // Aspect ratio only works for height:width, we don't expose a way to rotate it
  const height = dimensions.height;
  const ratioNumber = ratioStringToNumber(ratio);
  const width = height / ratioNumber;

  return { width, height };
}

function useClosestAspectRatio(
  dimensions: DimensionsResult
): [string | undefined, DimensionsResult | null, CameraRefCallback] {
  const [supportedAspectRatios, ref] = useSupportedAspectRatios();
  const [closestAspectRatio, setClosestAspectRatio] = useState<string | undefined>(
    findClosestAspectRatio(supportedAspectRatios, dimensions)
  );
  const [suggestedDimensions, setSuggestedDimensions] = useState<DimensionsResult | null>(null);

  useEffect(() => {
    const ratio = findClosestAspectRatio(supportedAspectRatios, dimensions);
    const dims = calculateSuggestedDimensions(dimensions, ratio);
    setClosestAspectRatio(ratio);
    setSuggestedDimensions(dims);
  }, [dimensions, supportedAspectRatios]);

  return [closestAspectRatio, suggestedDimensions, ref];
}

export function Camera(props: OriginalCamera['props']) {
  const [dimensions, onLayout] = useComponentDimensions();
  const [suggestedAspectRatio, suggestedDimensions, ref] = useClosestAspectRatio(dimensions);
  const [cameraIsReady, setCameraIsReady] = useState(false);
  const { style, ...rest } = props;

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <OriginalCamera
        onCameraReady={() => setCameraIsReady(true)}
        ref={cameraIsReady ? ref : null}
        ratio={suggestedAspectRatio}
        {...rest}
        style={suggestedDimensions ?? { flex: 1 }}
      />
    </View>
  );
}
