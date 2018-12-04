import * as AR from 'expo-ar';
import * as THREE from 'three';

class Light extends THREE.PointLight {
  constructor() {
    super(0xffee88, 1, 100, 2);
  }

  lightData?: AR.LightEstimation;

  set light(lightEstimation: AR.LightEstimation) {
    this.lightData = lightEstimation;

    const { ambientIntensity, pixelIntensity, red, green, blue } = lightEstimation;

    this.power = ambientIntensity ? ambientIntensity : pixelIntensity!; // TODO: is it correct?
  
    this.color = new THREE.Color(red / 255.0, green / 255.0, blue / 255.0);
  }

  update = async () => {
    const {
      [AR.FrameAttribute.LightEstimation]: lightEstimation,
    } = await AR.getCurrentFrameAsync({
      [AR.FrameAttribute.LightEstimation]: true,
    });
    this.light = lightEstimation!;
  };
}

export default Light;
