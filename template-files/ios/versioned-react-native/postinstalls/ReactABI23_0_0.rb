
    # Generated postinstall: ReactABI23_0_0
    if target.pod_name == 'ReactABI23_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI23_0_0kNeverRequested','-DkNeverProgressed=ReactABI23_0_0kNeverProgressed','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI23_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DregionAsJSON=ReactABI23_0_0regionAsJSON','-DunionRect=ReactABI23_0_0unionRect','-DJSNoBytecodeFileFormatVersion=ReactABI23_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI23_0_0JSSamplingProfilerEnabled','-DRECONNECT_DELAY_MS=ReactABI23_0_0RECONNECT_DELAY_MS','-DMAX_DELTA_TIME=ReactABI23_0_0MAX_DELTA_TIME','-DgCurrentGenerationCount=ReactABI23_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI23_0_0gPrintSkips','-DgPrintChanges=ReactABI23_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI23_0_0layoutNodeInternal','-DgDepth=ReactABI23_0_0gDepth','-DgPrintTree=ReactABI23_0_0gPrintTree','-DisUndefined=ReactABI23_0_0isUndefined','-DgNodeInstanceCount=ReactABI23_0_0gNodeInstanceCount']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI23_0_0RCT_DEV=1'
        # needed for GoogleMaps 2.x
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] ||= []
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Base/Frameworks'
        config.build_settings['FRAMEWORK_SEARCH_PATHS'] << '${PODS_ROOT}/GoogleMaps/Maps/Frameworks'
      end
    end
    # End generated postinstall
