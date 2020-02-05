import { Mode } from './constants';
export default function configureIosSplashScreen({ imagePath, mode, backgroundColor, }: {
    imagePath?: string;
    mode: Mode;
    backgroundColor: string;
}): Promise<void>;
