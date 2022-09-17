// tree-shaken side effects
import './reanimated2/js-reanimated/global';

// @ts-ignore backward compatibility with treeshaking
export * from './reanimated1';
export * from './reanimated2';
export * as default from './Animated';
