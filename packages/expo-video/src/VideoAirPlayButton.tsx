import { View } from 'react-native';

import { VideoAirPlayButtonProps } from './VideoAirPlayButton.types';

/**
 * A view displaying the [`AVRoutePickerView`](https://developer.apple.com/documentation/avkit/avroutepickerview). Shows a button, when pressed, an AirPlay device picker shows up, allowing users to stream the currently playing video
 * to any available AirPlay sink.
 *
 * > When using this view, make sure that the [`allowsExternalPlayback`](#allowsexternalplayback) player property is set to `true`.
 * @platform ios
 */
export default function VideoAirPlayButton(props: VideoAirPlayButtonProps) {
  return <View {...props} style={[{ minWidth: 30, minHeight: 30 }, props.style]} />;
}
