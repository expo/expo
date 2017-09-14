
    # Generated postinstall: ReactABI21_0_0
    if target.pod_name == 'ReactABI21_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI21_0_0kNeverRequested','-DkNeverProgressed=ReactABI21_0_0kNeverProgressed','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI21_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DregionAsJSON=ReactABI21_0_0regionAsJSON','-DunionRect=ReactABI21_0_0unionRect','-DJSNoBytecodeFileFormatVersion=ReactABI21_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI21_0_0JSSamplingProfilerEnabled','-DRECONNECT_DELAY_MS=ReactABI21_0_0RECONNECT_DELAY_MS','-DgCurrentGenerationCount=ReactABI21_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI21_0_0gPrintSkips','-DgPrintChanges=ReactABI21_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI21_0_0layoutNodeInternal','-DgDepth=ReactABI21_0_0gDepth','-DgPrintTree=ReactABI21_0_0gPrintTree','-DisUndefined=ReactABI21_0_0isUndefined','-DgNodeInstanceCount=ReactABI21_0_0gNodeInstanceCount']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI21_0_0RCT_DEV=1'
        # needed for GoogleMaps 2.x
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= []
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Base/Frameworks'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Maps/Frameworks'
      end
    end
    # End generated postinstall
