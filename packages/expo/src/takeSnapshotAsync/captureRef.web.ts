import { findDOMNode } from 'react-dom';
import { CaptureOptions } from 'react-native-view-shot';

import * as Creator from './Creator.web';

export default async function captureRef(
  component: Element,
  options: CaptureOptions = {}
): Promise<string | Uint8ClampedArray | Blob> {
  const element = getElement(component);
  const { format = 'png' } = options;
  const finalFormat = format.toLowerCase();
  switch (finalFormat) {
    case 'jpg':
      return Creator.createJPGAsync(element, options);
    case 'png':
      return Creator.createPNGAsync(element, options);
    case 'raw':
      return Creator.createPixelDataAsync(element, options);
    case 'svg':
      return Creator.createSVGAsync(element, options);
    case 'blob':
      return Creator.createBlobAsync(element, options);
    default:
      throw new Error(`takeSnapshotAsync: Unsupported format: ${finalFormat}`);
  }
}

const getElement = component => {
  try {
    return findDOMNode(component);
  } catch (e) {
    return component;
  }
};
