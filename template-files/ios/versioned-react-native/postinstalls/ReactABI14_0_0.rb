
    # Generated postinstall: ReactABI14_0_0
    if target.pod_name == 'ReactABI14_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI14_0_0kNeverRequested','-DkNeverProgressed=ReactABI14_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI14_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI14_0_0ZINDEX_STICKY_HEADER','-DgCurrentGenerationCount=ReactABI14_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI14_0_0gPrintSkips','-DgPrintChanges=ReactABI14_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI14_0_0layoutNodeInternal','-DgDepth=ReactABI14_0_0gDepth','-DgPrintTree=ReactABI14_0_0gPrintTree','-DisUndefined=ReactABI14_0_0isUndefined','-DgNodeInstanceCount=ReactABI14_0_0gNodeInstanceCount','-DSINGLE_FRAME_INTERVAL=ReactABI14_0_0SINGLE_FRAME_INTERVAL','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI14_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DJSNoBytecodeFileFormatVersion=ReactABI14_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI14_0_0JSSamplingProfilerEnabled','-DregionAsJSON=ReactABI14_0_0regionAsJSON','-DunionRect=ReactBAI14_0_0unionRect']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI14_0_0RCT_DEV=1'
      end
    end
    # End generated postinstall
