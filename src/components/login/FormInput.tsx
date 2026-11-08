import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable, ViewStyle, TextInputProps } from 'react-native';
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
  ...rest
}: FormInputProps) {
  const [isSecure, setIsSecure] = useState(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
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
        {...rest}
      />
      {showToggle && (
        <Pressable
          onPress={() => setIsSecure(!isSecure)}
          style={styles.toggleButton}
          accessibilityRole="button"
          accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          {isSecure ? hideIcon : toggleIcon}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LoginColors.cardBackground,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LoginColors.border,
    paddingHorizontal: Spacing.three,
    height: 56,
  },
  iconContainer: {
    marginRight: Spacing.two,
  },
  input: {
    flex: 1,
    color: LoginColors.text,
    fontSize: 14,
    fontWeight: '400',
  },
  toggleButton: {
    padding: Spacing.one,
    marginLeft: Spacing.one,
  },
});
