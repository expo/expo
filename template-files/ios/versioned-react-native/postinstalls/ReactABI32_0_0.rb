
      # Generated postinstall: ReactABI32_0_0
      if pod_name == 'ReactABI32_0_0' || pod_name == 'ABI32_0_0ExpoKit'
        target_installation_result.native_target.build_configurations.each do |config|
          config.build_settings['OTHER_CFLAGS'] = %w[
            -DkNeverRequested=ReactABI32_0_0kNeverRequested
            -DkNeverProgressed=ReactABI32_0_0kNeverProgressed
            -DkSMCalloutViewRepositionDelayForUIScrollView=ReactABI32_0_0kSMCalloutViewRepositionDelayForUIScrollView
            -DregionAsJSON=ReactABI32_0_0regionAsJSON
            -DunionRect=ReactABI32_0_0unionRect
            -DJSNoBytecodeFileFormatVersion=ReactABI32_0_0JSNoBytecodeFileFormatVersion
            -DJSSamplingProfilerEnabled=ReactABI32_0_0JSSamplingProfilerEnabled
            -DRECONNECT_DELAY_MS=ReactABI32_0_0RECONNECT_DELAY_MS
            -DMAX_DELTA_TIME=ReactABI32_0_0MAX_DELTA_TIME
            -DgCurrentGenerationCount=ReactABI32_0_0gCurrentGenerationCount
            -DgPrintSkips=ReactABI32_0_0gPrintSkips
            -DgPrintChanges=ReactABI32_0_0gPrintChanges
            -DlayoutNodeInternal=ReactABI32_0_0layoutNodeInternal
            -DgDepth=ReactABI32_0_0gDepth
            -DgPrintTree=ReactABI32_0_0gPrintTree
            -DisUndefined=ReactABI32_0_0isUndefined
            -DgNodeInstanceCount=ReactABI32_0_0gNodeInstanceCount
          ]
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI32_0_0RCT_DEV=1'
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI32_0_0RCT_ENABLE_INSPECTOR=0'
          config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ABI32_0_0ENABLE_PACKAGER_CONNECTION=0'
        end
      end
      # End generated postinstall
