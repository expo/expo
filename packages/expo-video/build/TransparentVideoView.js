import { PureComponent, createRef } from 'react';
import NativeVideoModule from './NativeVideoModule';
import NativeTransparentVideoView from './NativeTransparentVideoView';
/**
 * Displays a video with an alpha channel.
 *
 * The source must be a video compatible with android 4.4+ (https://developer.android.com/media/platform/supported-formats#video-codecs)
 * The source must be a composition of two videos vertically superposed:
 * - The upper part of the video must display the rgb channels
 * - The lower part of the video must display the alpha mask in shades of grey
 *   (black -> alpha = 0f, white -> alpha = 1f) to apply to the rgb part.
 *
 *   |-----------------------|
 *   |                       |
 *   |                       |
 *   |       rgb video       |
 *   |                       |
 *   |                       |
 *   |-----------------------|
 *   |                       |
 *   |                       |
 *   |  alpha mask video     |
 *   |                       |
 *   |                       |
 *   |-----------------------|
 *
 *   Warning : This cannot display a video that has an alpha channel like transparent
 *   webm. It only blends rgb data with alpha data.
 *
 * @platform android
 */
export class TransparentVideoView extends PureComponent {
    nativeRef = createRef();
    replace(source) {
        if (typeof source === 'string') {
            this.nativeRef.current?.replace({ uri: source });
            return;
        }
        this.nativeRef.current?.replace(source);
    }
    render() {
        const { player, ...props } = this.props;
        const playerId = getPlayerId(player);
        return <NativeTransparentVideoView {...props} player={playerId} ref={this.nativeRef}/>;
    }
}
// Temporary solution to pass the shared object ID instead of the player object.
// We can't really pass it as an object in the old architecture.
// Technically we can in the new architecture, but it's not possible yet.
function getPlayerId(player) {
    if (player instanceof NativeVideoModule.VideoPlayer) {
        // @ts-expect-error
        return player.__expo_shared_object_id__;
    }
    if (typeof player === 'number') {
        return player;
    }
    return null;
}
//# sourceMappingURL=TransparentVideoView.js.map