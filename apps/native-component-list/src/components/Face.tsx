import { FaceFeature, Point } from 'expo-face-detector';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const landmarkSize = 2;

export const scaledFace =
  (scale: number) =>
  ({ faceID, bounds, rollAngle, yawAngle }: FaceFeature) => (
    <View
      key={`face-${faceID || yawAngle}`}
      style={[
        styles.face,
        {
          width: bounds.size.width * scale,
          height: bounds.size.height * scale,
          left: bounds.origin.x * scale,
          top: bounds.origin.y * scale,
          transform: [
            { perspective: 600 },
            { rotateZ: `${rollAngle!.toFixed(0)}deg` },
            { rotateY: `${yawAngle!.toFixed(0)}deg` },
          ],
        },
      ]}>
      <Text style={styles.faceText}>ID: {faceID}</Text>
      <Text style={styles.faceText}>rollAngle: {rollAngle!.toFixed(0)}</Text>
      <Text style={styles.faceText}>yawAngle: {yawAngle!.toFixed(0)}</Text>
    </View>
  );

export const scaledLandmarks = (scale: number) => (face: FaceFeature) => {
  const renderLandmark = (position?: Point) =>
    position && (
      <View
        key={`${position?.x ?? 'no-x'}${position?.y ?? 'no-y'}`}
        style={[
          styles.landmark,
          {
            left: (position.x - landmarkSize / 2) * scale,
            top: (position.y - landmarkSize / 2) * scale,
          },
        ]}
      />
    );
  console.log('landmark', face);
  return (
    <View key={`landmarks-${face.faceID || face.yawAngle}`}>
      {renderLandmark(face.leftEyePosition)}
      {renderLandmark(face.rightEyePosition)}
      {renderLandmark(face.leftEarPosition)}
      {renderLandmark(face.rightEarPosition)}
      {renderLandmark(face.leftCheekPosition)}
      {renderLandmark(face.rightCheekPosition)}
      {renderLandmark(face.leftMouthPosition)}
      {renderLandmark(face.mouthPosition)}
      {renderLandmark(face.rightMouthPosition)}
      {renderLandmark(face.noseBasePosition)}
      {renderLandmark(face.bottomMouthPosition)}
    </View>
  );
};

export const face = scaledFace(1);
export const landmarks = scaledLandmarks(1);

const styles = StyleSheet.create({
  face: {
    padding: 10,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
    borderColor: '#FFD700',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  landmark: {
    width: landmarkSize,
    height: landmarkSize,
    position: 'absolute',
    backgroundColor: 'red',
  },
  faceText: {
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 10,
    backgroundColor: 'transparent',
  },
});
