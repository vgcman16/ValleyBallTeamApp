import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Overlay as RNEOverlay, OverlayProps } from 'react-native-elements';

interface CustomOverlayProps extends Omit<OverlayProps, 'isVisible'> {
  visible: boolean;
  children: React.ReactNode;
  overlayStyle?: StyleProp<ViewStyle>;
}

export const CustomOverlay: React.FC<CustomOverlayProps> = ({
  visible,
  children,
  overlayStyle,
  ...props
}) => {
  return (
    <RNEOverlay
      isVisible={visible}
      overlayStyle={overlayStyle}
      backdropStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      animationType="fade"
      {...props}
    >
      {children}
    </RNEOverlay>
  );
};
