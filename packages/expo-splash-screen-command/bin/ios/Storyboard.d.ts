import { ColorDescriptor } from 'color-string';
import { ResizeMode } from '../constants';
import { IosProject } from './pbxproj';
/**
 * Creates [STORYBOARD] file containing ui description of Splash/Launch Screen.
 * > WARNING: modifies `pbxproj`
 */
export default function configureStoryboard(iosProject: IosProject, { resizeMode, backgroundColor, splashScreenImagePresent, }: {
    resizeMode: ResizeMode;
    backgroundColor: ColorDescriptor;
    splashScreenImagePresent: boolean;
}): Promise<void>;
