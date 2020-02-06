import { ResizeMode } from './constants';
export default function configureIosSplashScreen({ imagePath, resizeMode, backgroundColor, }: {
    imagePath?: string;
    resizeMode: ResizeMode;
    backgroundColor: string;
}): Promise<void>;
