    # Generated postinstall: ReactABI8_0_0
    if target.pod_name == 'ReactABI8_0_0'
      target.native_target.build_configurations.each do |config|
        config.build_settings['OTHER_CFLAGS'] = ['-DkNeverRequested=ReactABI8_0_0kNeverRequested','-DkNeverProgressed=ReactABI8_0_0kNeverProgressed','-DZINDEX_DEFAULT=ReactABI8_0_0ZINDEX_DEFAULT','-DZINDEX_STICKY_HEADER=ReactABI8_0_0ZINDEX_STICKY_HEADER','-DgCurrentGenerationCount=ReactABI8_0_0gCurrentGenerationCount','-DgPrintSkips=ReactABI8_0_0gPrintSkips','-DgPrintChanges=ReactABI8_0_0gPrintChanges','-DlayoutNodeInternal=ReactABI8_0_0layoutNodeInternal','-DgDepth=ReactABI8_0_0gDepth','-DgPrintTree=ReactABI8_0_0gPrintTree','-DisUndefined=ReactABI8_0_0isUndefined']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI8_0_0RCT_DEV=1'
      end
    end
    # End generated postinstall
