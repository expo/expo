
    # Generated postinstall: ReactABI13_0_0
    if target.pod_name == 'ReactABI13_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI13_0_0kNeverRequested','-DkNeverProgressed=ReactABI13_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI13_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI13_0_0ZINDEX_STICKY_HEADER','-DgCurrentGenerationCount=ReactABI13_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI13_0_0gPrintSkips','-DgPrintChanges=ReactABI13_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI13_0_0layoutNodeInternal','-DgDepth=ReactABI13_0_0gDepth','-DgPrintTree=ReactABI13_0_0gPrintTree','-DisUndefined=ReactABI13_0_0isUndefined','-DgNodeInstanceCount=ReactABI13_0_0gNodeInstanceCount','-DSINGLE_FRAME_INTERVAL=ReactABI13_0_0SINGLE_FRAME_INTERVAL','-DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI13_0_0kSMCalloutViewRepositionDelayForUIScrollView','-DJSNoBytecodeFileFormatVersion=ReactABI13_0_0JSNoBytecodeFileFormatVersion','-DJSSamplingProfilerEnabled=ReactABI13_0_0JSSamplingProfilerEnabled']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI13_0_0RCT_DEV=1'
      end
    end
    # End generated postinstall
