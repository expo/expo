import { unstable_getMaterialSymbolSourceAsync } from 'expo-symbols';
import { convertComponentSrcToImageSource } from './icon';
import { NativeTabsTriggerPromiseIcon } from '../common/elements';
export function convertMaterialIconNameToImageSource(name) {
    return convertComponentSrcToImageSource(<NativeTabsTriggerPromiseIcon loader={() => unstable_getMaterialSymbolSourceAsync(name, 24, 'white')}/>);
}
//# sourceMappingURL=materialIconConverter.android.js.map