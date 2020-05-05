import { ResizeMode } from './constants';
export default function configureAndroidSplashScreen({ imagePath, resizeMode, backgroundColor, }: {
    imagePath?: string;
    resizeMode: ResizeMode;
    backgroundColor: string;
}): Promise<void>;
