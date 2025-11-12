import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { convertComponentSrcToImageSource } from './icon';
import { NativeTabsTriggerVectorIcon, type MaterialIcon } from '../common/elements';

export function convertMaterialIconNameToImageSource(
  name: MaterialIcon['material']
): ReturnType<typeof convertComponentSrcToImageSource> {
  return convertComponentSrcToImageSource(
    <NativeTabsTriggerVectorIcon family={MaterialIcons} name={name} />
  );
}
