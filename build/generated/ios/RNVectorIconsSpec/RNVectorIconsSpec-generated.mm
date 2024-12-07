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

#import "RNVectorIconsSpec.h"


@implementation NativeRNVectorIconsSpecBase


- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  _eventEmitterCallback = std::move(eventEmitterCallbackWrapper->_eventEmitterCallback);
}
@end


namespace facebook::react {
  
    static facebook::jsi::Value __hostFunction_NativeRNVectorIconsSpecJSI_getImageForFont(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "getImageForFont", @selector(getImageForFont:glyph:fontSize:color:resolve:reject:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeRNVectorIconsSpecJSI_getImageForFontSync(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, StringKind, "getImageForFontSync", @selector(getImageForFontSync:glyph:fontSize:color:), args, count);
    }

    static facebook::jsi::Value __hostFunction_NativeRNVectorIconsSpecJSI_loadFontWithFileName(facebook::jsi::Runtime& rt, TurboModule &turboModule, const facebook::jsi::Value* args, size_t count) {
      return static_cast<ObjCTurboModule&>(turboModule).invokeObjCMethod(rt, PromiseKind, "loadFontWithFileName", @selector(loadFontWithFileName:extension:resolve:reject:), args, count);
    }

  NativeRNVectorIconsSpecJSI::NativeRNVectorIconsSpecJSI(const ObjCTurboModule::InitParams &params)
    : ObjCTurboModule(params) {
      
        methodMap_["getImageForFont"] = MethodMetadata {4, __hostFunction_NativeRNVectorIconsSpecJSI_getImageForFont};
        
        
        methodMap_["getImageForFontSync"] = MethodMetadata {4, __hostFunction_NativeRNVectorIconsSpecJSI_getImageForFontSync};
        
        
        methodMap_["loadFontWithFileName"] = MethodMetadata {2, __hostFunction_NativeRNVectorIconsSpecJSI_loadFontWithFileName};
        
  }
} // namespace facebook::react