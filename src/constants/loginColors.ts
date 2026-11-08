export const LoginColors = {
  background: '#0F1419',
  cardBackground: '#1A1F2E',
  primary: '#FF6B35',
  primaryLight: '#FF8C42',
  primaryDark: '#FF4A2A',
  accent: '#FFD700',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#FF8C42',
  borderLight: 'rgba(255, 140, 66, 0.3)',
  success: '#4CAF50',
  error: '#FF6B6B',
  gradientStart: '#FF6B35',
  gradientEnd: '#FF4A2A',
} as const;

export type LoginColor = keyof typeof LoginColors;
