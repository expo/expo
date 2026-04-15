import { Host as SwiftUIHost, type HostProps } from '@expo/ui/swift-ui';

export function Host(props: HostProps) {
  // When matchContents is true, enable useViewportSizeMeasurement so that
  // SwiftUI children receive a non-zero size proposal. Without this, the
  // default ZStackLayout passes through the initial zero proposal from RN,
  // causing flexible views like Text to compress to nothing.
  const needsViewport = props.matchContents && !props.useViewportSizeMeasurement;

  return (
    <SwiftUIHost
      {...props}
      useViewportSizeMeasurement={needsViewport || props.useViewportSizeMeasurement}
    />
  );
}
