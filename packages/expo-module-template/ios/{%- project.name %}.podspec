<% const sdk = typeof compat === 'undefined' ? {} : compat; -%>
<% const isStandalone = type === 'standalone' || type === 'remote'; -%>
<% if (isStandalone) { -%>
require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

<% } -%>
Pod::Spec.new do |s|
  s.name           = '<%- project.name %>'
<% if (isStandalone) { -%>
  s.version        = package['version']
  s.summary        = package['description']
  s.description    = package['description']
  s.license        = package['license']
  s.author         = package['author']
  s.homepage       = package['homepage']
<% } else { -%>
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
<% } -%>
  s.platforms      = {
    :ios => '<%- sdk.iosDeploymentTarget ?? '16.4' %>',
    :tvos => '<%- sdk.iosDeploymentTarget ?? '16.4' %>'
  }
<% if (isStandalone) { -%>
  s.swift_version  = '5.9'
<% } -%>
  s.source         = { git: '<% if (isStandalone) { %><%- repo %><% } %>' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
<% if (usesSwiftUI) { -%>
  s.dependency 'ExpoUI'
<% } -%>

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
