/**
 * This code was generated by [react-native-codegen](https://www.npmjs.com/package/react-native-codegen).
 *
 * Do not edit this file as changes may cause incorrect behavior and will be lost
 * once the code is regenerated.
 *
 * @generated by codegen project: GenerateModuleObjCpp
 *
 * We create an umbrella header (and corresponding implementation) here since
 * Cxx compilation in BUCK has a limitation: source-code producing genrule()s
 * must have a single output. More files => more genrule()s => slower builds.
 */

#ifndef __cplusplus
#error This file must be compiled as Obj-C++. If you are importing it, you must change your file extension to .mm.
#endif

// Avoid multiple includes of rndocumentpicker symbols
#ifndef rndocumentpicker_H
#define rndocumentpicker_H

#import <Foundation/Foundation.h>
#import <RCTRequired/RCTRequired.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <RCTTypeSafety/RCTTypedModuleConstants.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTCxxConvert.h>
#import <React/RCTManagedPointer.h>
#import <ReactCommon/RCTTurboModule.h>
#import <optional>
#import <vector>


@protocol NativeDocumentPickerSpec <RCTBridgeModule, RCTTurboModule>

- (void)pick:(NSDictionary *)options
     resolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject;
- (void)releaseSecureAccess:(NSArray *)uris
                    resolve:(RCTPromiseResolveBlock)resolve
                     reject:(RCTPromiseRejectBlock)reject;
- (void)pickDirectory:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject;

@end

@interface NativeDocumentPickerSpecBase : NSObject {
@protected
facebook::react::EventEmitterCallback _eventEmitterCallback;
}
- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper;


@end

namespace facebook::react {
  /**
   * ObjC++ class for module 'NativeDocumentPicker'
   */
  class JSI_EXPORT NativeDocumentPickerSpecJSI : public ObjCTurboModule {
  public:
    NativeDocumentPickerSpecJSI(const ObjCTurboModule::InitParams &params);
  };
} // namespace facebook::react

#endif // rndocumentpicker_H
