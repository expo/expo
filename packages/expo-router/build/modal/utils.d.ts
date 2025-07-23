import type { StackAnimationTypes } from 'react-native-screens';
import type { ModalProps } from './Modal';
import type { ModalConfig } from './types';
export declare function areDetentsValid(detents: ModalProps['detents']): boolean;
export declare function getStackAnimationType(config: ModalConfig): StackAnimationTypes | undefined;
export declare function getStackPresentationType(config: ModalConfig): "transparentModal" | "fullScreenModal" | "formSheet" | "pageSheet";
//# sourceMappingURL=utils.d.ts.map