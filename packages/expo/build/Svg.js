import * as SvgModules from 'react-native-svg';
import deprecatedModule from './deprecatedModule';
const { Svg } = SvgModules;
for (const key in SvgModules) {
    if (key !== 'default' && key !== 'Svg') {
        Object.defineProperty(Svg, key, {
            enumerable: true,
            get() {
                deprecatedModule(`Svg.${key} -> import { ${key} } from 'react-native-svg'`, 'react-native-svg');
                return SvgModules[key];
            },
        });
    }
}
export default Svg;
//# sourceMappingURL=Svg.js.map