import { useEffect, useState } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

type DimensionsType = { window: ScaledSize; screen: ScaledSize };

export default function useDimensions(): DimensionsType {
  const [dimensions, setDimensions] = useState<DimensionsType>({
    window: Dimensions.get('window'),
    screen: Dimensions.get('screen'),
  });

  const onChange = ({ window, screen }: any) => {
    setDimensions({ window, screen });
  };

  useEffect(() => {
    Dimensions.addEventListener('change', onChange);

    return () => Dimensions.removeEventListener('change', onChange);
  }, []);

  return dimensions;
}
