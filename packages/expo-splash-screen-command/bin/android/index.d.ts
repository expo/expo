import { ColorDescriptor } from 'color-string';
import { ResizeMode } from '../constants';
export default function configureAndroid(projectRootPath: string, { imagePath, resizeMode, backgroundColor, }: {
    imagePath?: string;
    resizeMode: ResizeMode;
    backgroundColor: ColorDescriptor;
}): Promise<void>;
