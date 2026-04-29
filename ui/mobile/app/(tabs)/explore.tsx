import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Unused default Expo tab — kept as stub to avoid routing errors.
export default function TabTwoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.text}>DefenXion</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F19' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text:      { color: '#7D8590', fontSize: 14 },
});
