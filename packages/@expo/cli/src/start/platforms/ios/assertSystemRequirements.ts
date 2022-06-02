import { SimulatorAppPrerequisite } from '../../doctor/apple/SimulatorAppPrerequisite';
import { XcodePrerequisite } from '../../doctor/apple/XcodePrerequisite';
import { XcrunPrerequisite } from '../../doctor/apple/XcrunPrerequisite';

export async function assertSystemRequirementsAsync() {
  // Order is important
  await XcodePrerequisite.instance.assertAsync();
  await XcrunPrerequisite.instance.assertAsync();
  await SimulatorAppPrerequisite.instance.assertAsync();
}
