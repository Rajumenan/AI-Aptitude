import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const ScreenWrapper = ({ 
  children, 
  scroll = false, 
  contentContainerStyle = {},
  style = {}
}) => {
  const { theme, isDarkMode } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }, style]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
      />
      {scroll ? (
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentContainerStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexGrow: 1,
  },
});

export default ScreenWrapper;
