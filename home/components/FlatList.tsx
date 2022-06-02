import { FlatList as RNFlatList, Platform } from 'react-native';
import { FlatList as RNGHFlatList } from 'react-native-gesture-handler';

export const FlatList = Platform.OS === 'android' ? RNFlatList : RNGHFlatList;
