import React from 'react';
import { Text as RNText, TextStyle, StyleSheet, StyleProp } from 'react-native';

interface TextProps {
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  h4?: boolean;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export const Text = ({
  h1 = false,
  h2 = false,
  h3 = false,
  h4 = false,
  style,
  children,
}: TextProps) => {
  const textStyle = [
    styles.text,
    h1 && styles.h1,
    h2 && styles.h2,
    h3 && styles.h3,
    h4 && styles.h4,
    style,
  ];

  return (
    <RNText style={textStyle}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    color: '#000000',
    fontSize: 14,
  },
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  h4: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
});
