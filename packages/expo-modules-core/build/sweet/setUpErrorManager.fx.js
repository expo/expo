import { Platform } from '..';
import { EventEmitter } from '..';
import NativeErrorManager from './NativeErrorManager';
if (__DEV__ && Platform.OS === 'android') {
    const onNewException = 'SweetErrorManager.onNewException';
    const eventEmitter = new EventEmitter(NativeErrorManager);
    eventEmitter.addListener(onNewException, ({ message }) => {
        console.error(message);
    });
}
//# sourceMappingURL=setUpErrorManager.fx.js.map