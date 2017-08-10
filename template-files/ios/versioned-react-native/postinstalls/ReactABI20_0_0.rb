
    # Generated postinstall: ReactABI20_0_0
    if target.pod_name == 'ReactABI20_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI20_0_0kNeverRequested','-DkNeverProgressed=ReactABI20_0_0kNeverProgressed','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI20_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DregionAsJSON=ReactABI20_0_0regionAsJSON','-DunionRect=ReactABI20_0_0unionRect','-DJSNoBytecodeFileFormatVersion=ReactABI20_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI20_0_0JSSamplingProfilerEnabled','-DRECONNECT_DELAY_MS=ABI20_0_0RECONNECT_DELAY_MS','-DgCurrentGenerationCount=ReactABI20_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI20_0_0gPrintSkips','-DgPrintChanges=ReactABI20_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI20_0_0layoutNodeInternal','-DgDepth=ReactABI20_0_0gDepth','-DgPrintTree=ReactABI20_0_0gPrintTree','-DisUndefined=ReactABI20_0_0isUndefined','-DgNodeInstanceCount=ReactABI20_0_0gNodeInstanceCount']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI20_0_0RCT_DEV=1'
        # needed for GoogleMaps 2.x
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= []
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Base/Frameworks'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Maps/Frameworks'
      end
    end
    # End generated postinstall
