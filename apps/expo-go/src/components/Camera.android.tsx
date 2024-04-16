import { Camera as OriginalCamera } from 'expo-camera/legacy';
import React, { useCallback, useState, useEffect } from 'react';
import { View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

type CameraRef = OriginalCamera;
type CameraRefCallback = (node: CameraRef) => void;
type Dimensions = { width: number; height: number };

// This Camera component will automatically pick the appropriate ratio and
// dimensions to fill the given layout properties, and it will resize according
// to the same logic as resizeMode: cover. If somehow something goes wrong while
// attempting to autosize, it will just fill the given layout and use the
// default aspect ratio, likely resulting in skew.
export function Camera(props: OriginalCamera['props']) {
  const [dimensions, onLayout] = useComponentDimensions();
  const [suggestedAspectRatio, suggestedDimensions, ref] = useAutoSize(dimensions);
  const [cameraIsReady, setCameraIsReady] = useState(false);
  const { style, ...rest } = props;
  const { width, height } = suggestedDimensions || {};

  return (
    <View
      onLayout={onLayout}
      style={[
        {
          overflow: 'hidden',
          backgroundColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <OriginalCamera
        onCameraReady={() => setCameraIsReady(true)}
        ref={cameraIsReady ? ref : undefined}
        ratio={suggestedAspectRatio ?? undefined}
        style={
          suggestedDimensions && width && height
            ? {
                position: 'absolute',
                width,
                height,
                ...(height! > width!
                  ? { top: -(height! - dimensions!.height) / 2 }
                  : { left: -(width! - dimensions!.width) / 2 }),
              }
            : { flex: 1 }
        }
        {...rest}
      />
    </View>
  );
}

function useAutoSize(
  dimensions: Dimensions | null
): [string | null, Dimensions | null, CameraRefCallback] {
  const [supportedAspectRatios, ref] = useSupportedAspectRatios();
  const [suggestedAspectRatio, setSuggestedAspectRatio] = useState<string | null>(null);
  const [suggestedDimensions, setSuggestedDimensions] = useState<Dimensions | null>(null);

  useEffect(() => {
    const suggestedAspectRatio = findClosestAspectRatio(supportedAspectRatios, dimensions);
    const suggestedDimensions = calculateSuggestedDimensions(dimensions, suggestedAspectRatio);

    if (!suggestedAspectRatio || !suggestedDimensions) {
      setSuggestedAspectRatio(null);
      setSuggestedDimensions(null);
    } else {
      setSuggestedAspectRatio(suggestedAspectRatio);
      setSuggestedDimensions(suggestedDimensions);
    }
  }, [dimensions, supportedAspectRatios]);

  return [suggestedAspectRatio, suggestedDimensions, ref];
}

// Get the supported aspect ratios from the camera ref when the node is available
// NOTE: this will fail if the camera isn't ready yet. So we need to avoid setting the
// ref until the camera ready callback has fired
function useSupportedAspectRatios(): [string[] | null, CameraRefCallback] {
  const [aspectRatios, setAspectRatios] = useState<string[] | null>(null);

  const ref = useCallback(
    (node: CameraRef | null) => {
      async function getSupportedAspectRatiosAsync(node: OriginalCamera) {
        try {
          const result = await node.getSupportedRatiosAsync();
          setAspectRatios(result);
        } catch (e) {
          console.error(e);
        }
      }

      if (node !== null) {
        getSupportedAspectRatiosAsync(node);
      }
    },
    [setAspectRatios]
  );

  return [aspectRatios, ref];
}

const useComponentDimensions = (): [Dimensions | null, (e: any) => void] => {
  const [dimensions, setDimensions] = useState<Dimensions | null>(null);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
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
  dimensions: Dimensions | null
) {
  if (!supportedAspectRatios || !dimensions) {
    return null;
  }

  try {
    const dimensionsRatio =
      Math.max(dimensions.height, dimensions.width) / Math.min(dimensions.height, dimensions.width);

    const aspectRatios = [...supportedAspectRatios];
    aspectRatios.sort((a: string, b: string) => {
      const ratioA = ratioStringToNumber(a);
      const ratioB = ratioStringToNumber(b);
      return Math.abs(dimensionsRatio - ratioA) - Math.abs(dimensionsRatio - ratioB);
    });

    return aspectRatios[0];
  } catch (e) {
    // If something unexpected happens just bail out
    console.error(e);
    return null;
  }
}

function calculateSuggestedDimensions(
  containerDimensions: Dimensions | null,
  ratio: string | null
) {
  if (!ratio || !containerDimensions) {
    return null;
  }

  try {
    const ratioNumber = ratioStringToNumber(ratio);
    const width = containerDimensions.width;
    const height = width * ratioNumber;
    return { width, height };
  } catch (e) {
    // If something unexpected happens just bail out
    console.error(e);
    return null;
  }
}
