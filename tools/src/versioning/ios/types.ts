import { Podspec } from '../../CocoaPods';
import { FileTransforms } from '../../Transforms.types';

export type VersioningModuleConfig = {
  transforms?: FileTransforms;
  mutatePodspec?: (podspec: Podspec) => void;
};
