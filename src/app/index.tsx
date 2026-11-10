import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LoginColors } from '@/constants/loginColors';
import { useAuth } from '@/providers/auth-provider';

export default function Index() {
  const { userToken, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={LoginColors.primary} />
      </View>
    );
  }

  return <Redirect href={userToken ? '/home' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LoginColors.background,
  },
});
