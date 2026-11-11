import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, type TextInputProps, View, type ViewStyle } from 'react-native';

import { LoginColors } from '@/constants/loginColors';
import { Spacing } from '@/constants/theme';

interface FormInputProps extends TextInputProps {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  showToggle?: boolean;
  toggleIcon?: React.ReactNode;
  hideIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function FormInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  showToggle = false,
  toggleIcon,
  hideIcon,
  containerStyle,
  onFocus,
  onBlur,
  ...rest
}: FormInputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, isFocused && styles.containerFocused, containerStyle]}>
      <View style={styles.iconContainer}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={LoginColors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={isSecure && secureTextEntry}
        autoCapitalize="none"
        autoCorrect={false}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
      {showToggle ? (
        <Pressable
          onPress={() => setIsSecure((current) => !current)}
          style={({ pressed }) => [styles.toggleButton, pressed && styles.toggleButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel={isSecure ? 'Tampilkan password' : 'Sembunyikan password'}
          accessibilityState={{ selected: !isSecure }}
          hitSlop={8}>
          {isSecure ? hideIcon : toggleIcon}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.22)',
    backgroundColor: 'rgba(15, 20, 25, 0.42)',
    paddingHorizontal: Spacing.three,
  },
  containerFocused: {
    borderColor: LoginColors.primaryLight,
    backgroundColor: 'rgba(26, 31, 46, 0.9)',
  },
  iconContainer: {
    marginRight: Spacing.two,
  },
  input: {
    minHeight: 54,
    flex: 1,
    color: LoginColors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -Spacing.one,
  },
  toggleButtonPressed: {
    opacity: 0.65,
  },
});
