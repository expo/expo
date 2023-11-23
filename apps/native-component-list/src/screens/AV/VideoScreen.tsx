import React from 'react';
import { PixelRatio, ScrollView, StyleSheet } from 'react-native';

import VideoPlayer from './VideoPlayer';
import HeadingText from '../../components/HeadingText';

export default function VideoScreen() {
  const rootUrl = `https://api.wordscenes.com`
  const type ='widevine'
  const drmLicenseServerUrl =  `${rootUrl}/drmLicense?drmType=${type}`
  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <HeadingText>HTTP playe2r1</HeadingText>
      <VideoPlayer
        sources={[
            {uri: 'https://media.axprod.net/TestVectors/v7-MultiDRM-SingleKey/Manifest_1080p.mpd', headers: {test: 'test11',drm : {type: 'widevine', licenseServer: 'https://drm-widevine-licensing.axtest.net/AcquireLicense', drmHeaders: {
              'X-AxDRM-Message': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2ZXJzaW9uIjoxLCJjb21fa2V5X2lkIjoiYjMzNjRlYjUtNTFmNi00YWUzLThjOTgtMzNjZWQ1ZTMxYzc4IiwibWVzc2FnZSI6eyJ0eXBlIjoiZW50aXRsZW1lbnRfbWVzc2FnZSIsImZpcnN0X3BsYXlfZXhwaXJhdGlvbiI6NjAsInBsYXlyZWFkeSI6eyJyZWFsX3RpbWVfZXhwaXJhdGlvbiI6dHJ1ZX0sImtleXMiOlt7ImlkIjoiOWViNDA1MGQtZTQ0Yi00ODAyLTkzMmUtMjdkNzUwODNlMjY2IiwiZW5jcnlwdGVkX2tleSI6ImxLM09qSExZVzI0Y3Iya3RSNzRmbnc9PSJ9XX19.FAbIiPxX8BHi9RwfzD7Yn-wugU19ghrkBFKsaCPrZmU'

            }}}}

        ]}
      />
      <HeadingText>Local asset1 player</HeadingText>
      <VideoPlayer
        sources={[
          require('../../../assets/videos/ace.mp4'),
          require('../../../assets/videos/star.mp4'),
        ]}
      />
    </ScrollView>
  );
}
VideoScreen.navigationOptions = {
  title: 'Video (expo-av)',
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 10,
  },
  player: {
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
});
