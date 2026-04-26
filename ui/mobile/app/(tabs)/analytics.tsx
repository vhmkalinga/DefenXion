import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, LineChart } from 'react-native-chart-kit';
import Theme from '../../constants/theme';

const { width } = Dimensions.get('window');

const chartConfig = {
  backgroundGradientFrom: Theme.colors.surface,
  backgroundGradientTo: Theme.colors.surface,
  color: (opacity = 1) => `rgba(31, 111, 235, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(125, 133, 144, ${opacity})`,
  strokeWidth: 2, // optional, default 3
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

const pieData = [
  { name: 'DDoS', population: 45, color: Theme.colors.danger, legendFontColor: Theme.colors.textMuted, legendFontSize: 12 },
  { name: 'Malware', population: 30, color: Theme.colors.warning, legendFontColor: Theme.colors.textMuted, legendFontSize: 12 },
  { name: 'Brute Force', population: 20, color: Theme.colors.primary, legendFontColor: Theme.colors.textMuted, legendFontSize: 12 },
  { name: 'SQLi', population: 5, color: '#A1CEDC', legendFontColor: Theme.colors.textMuted, legendFontSize: 12 },
];

const lineData = {
  labels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43, 50],
      color: (opacity = 1) => Theme.colors.primary, 
      strokeWidth: 2
    }
  ]
};

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>System Analytics</Text>
          <Text style={styles.headerSubtitle}>Last 7 Days Performance</Text>
        </View>

        {/* Pie Chart Card */}
        <View style={styles.card}>
          <Text style={styles.chartTitle}>Threat Distribution</Text>
          <View style={styles.chartWrapper}>
            <PieChart
              data={pieData}
              width={width - Theme.spacing.lg * 2 - 40}
              height={200}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"15"}
              center={[10, 0]}
              hasLegend={true}
              absolute
            />
          </View>
        </View>

        {/* Line Chart Card */}
        <View style={[styles.card, { marginTop: Theme.spacing.lg }]}>
          <Text style={styles.chartTitle}>Traffic Volume (Requests/Sec)</Text>
          <View style={styles.chartWrapper}>
            <LineChart
              data={lineData}
              width={width - Theme.spacing.lg * 2 - 40} // subtracting paddings
              height={220}
              chartConfig={chartConfig}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { padding: Theme.spacing.lg, paddingBottom: 100 },
  
  header: { marginBottom: Theme.spacing.xl },
  headerTitle: { color: Theme.colors.text, fontSize: 24, fontWeight: 'bold' },
  headerSubtitle: { color: Theme.colors.textMuted, fontSize: 13, marginTop: 4 },
  
  card: { backgroundColor: Theme.colors.surface, padding: Theme.spacing.lg, borderRadius: Theme.radii.lg, borderWidth: 1, borderColor: Theme.colors.border },
  chartTitle: { color: Theme.colors.text, fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Theme.spacing.md },
  chartWrapper: { alignItems: 'center', justifyContent: 'center' }
});
