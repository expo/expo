import Constants from 'expo-constants';

type ConstantsType = typeof Constants;

export type Manifest = ConstantsType['manifest'] | ConstantsType['manifest2'];
