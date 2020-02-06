import 'core-js/es/string/match-all';
import { ResizeMode } from './constants';
export default function configureAndroidSplashScreen({ imagePath, resizeMode, backgroundColor, }: {
    imagePath?: string;
    resizeMode: ResizeMode;
    backgroundColor: string;
}): Promise<void>;
