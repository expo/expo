import fs from 'fs-extra';
import path from 'path';

import { getExpotoolsDir } from '../../Directories';

export const JniLibNames = [
  'libfb',
  'libglog_init',
  'glog',
  'reactnativejni',
  'reactnativejnifb',
  'csslayout',
  'yoga',
  'fbgloginit',
  'yogajni',
  'privatedata',
  'fabricjscjni',
  'jscexecutor',
  'libjscexecutor',
  'jsinspector',
  'libjsinspector',
  'fabricjni',
  'turbomodulejsijni',
  'reactnativeblob',
  'jsijniprofiler',
  'hermes',
  'hermes_executor',
  'hermes_executor_common',
  'hermes_inspector',
  'reanimated',
  'folly_futures',
  'folly_runtime',
  'react_codegen_rncore',
  'react_nativemodule_core',
  'reactnativeutilsjni',
  'reactperfloggerjni',
  'butter',
  'cxxcomponents',
  'jsi',
  'logger',
  'mapbufferjni',
  'react_debug',
  'react_newarchdefaults',
  'react_render_animations',
  'react_render_attributedstring',
  'react_render_componentregistry',
  'react_render_core',
  'react_render_debug',
  'react_render_graphics',
  'react_render_imagemanager',
  'react_render_leakchecker',
  'react_render_mapbuffer',
  'react_render_mounting',
  'react_render_runtimescheduler',
  'react_render_scheduler',
  'react_render_telemetry',
  'react_render_templateprocessor',
  'react_render_textlayoutmanager',
  'react_render_uimanager',
  'react_utils',
  'react_config',
  'rrc_image',
  'rrc_modal',
  'rrc_progressbar',
  'rrc_root',
  'rrc_scrollview',
  'rrc_slider',
  'rrc_switch',
  'rrc_text',
  'rrc_textinput',
  'rrc_unimplementedview',
  'rrc_view',
  'runtimeexecutor',
];

// this list is used in the shell scripts as well as directly by expotools
// we read it in here to keep the source of truth in one place
export const getJavaPackagesToRename = async () => {
  const packagesToRename = await fs.readFile(
    path.join(getExpotoolsDir(), 'src/versioning/android/android-packages-to-rename.txt'),
    'utf8'
  );
  return packagesToRename.split('\n').filter((p: string) => !!p);
};
