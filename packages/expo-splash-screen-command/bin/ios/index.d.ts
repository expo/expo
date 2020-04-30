import { ColorDescriptor } from 'color-string';
import { ResizeMode } from '../constants';
export default function configureIos(projectRootPath: string, { imagePath, resizeMode, backgroundColor, }: {
    imagePath?: string;
    resizeMode: ResizeMode;
    backgroundColor: ColorDescriptor;
}): Promise<void>;
