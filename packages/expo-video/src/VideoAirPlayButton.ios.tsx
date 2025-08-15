import NativeVideoAirPlayButton from './NativeVideoAirPlayButtonView';
import { VideoAirPlayButtonProps } from './VideoAirPlayButton.types';

export default function VideoAirPlayButton(props: VideoAirPlayButtonProps) {
  return (
    <NativeVideoAirPlayButton {...props} style={[{ minWidth: 30, minHeight: 30 }, props.style]} />
  );
}
