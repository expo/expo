import * as Device from 'expo-device';

export function isQuest() {
  const manufacturer = Device.manufacturer || '';
  const modelName = Device.modelName || '';

  const isQuestModel = modelName.toLowerCase().includes('quest');
  const isOculusOrMeta =
    manufacturer.toLowerCase() === 'oculus' || manufacturer.toLowerCase() === 'meta';

  return isOculusOrMeta && isQuestModel;
}
