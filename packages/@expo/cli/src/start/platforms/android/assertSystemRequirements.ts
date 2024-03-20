import { profile } from '../../../utils/profile';
import { AndroidPrerequisite } from '../../doctor/android/AndroidPrerequisite';

export async function assertSystemRequirementsAsync() {
  await profile(
    AndroidPrerequisite.instance.assertAsync.bind(AndroidPrerequisite.instance),
    'AndroidPrerequisite'
  )();
}
