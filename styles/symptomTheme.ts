import { StyleSheet } from 'react-native';

export const SymptomColors = {
  primary: '#8b5cf6',
  primaryHover: '#a78bfa',
  primaryLight: 'rgba(139, 92, 246, 0.1)',
  bgGlass: 'rgba(22, 28, 54, 0.45)',
  border: 'rgba(255, 255, 255, 0.08)',
  textMain: '#f3f4f6',
  textSub: '#9ca3af',
  
  risk: {
    low: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', label: '낮음 (Low)' },
    medium: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.15)', label: '보통 (Medium)' },
    high: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', label: '높음 (High)' },
    very_high: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', label: '매우 높음 (Very High)' }
  }
};

export const SymptomSharedStyles = StyleSheet.create({
  glassContainer: {
    backgroundColor: SymptomColors.bgGlass,
    borderWidth: 1,
    borderColor: SymptomColors.border,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: SymptomColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SymptomColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 3,
  },
  actionButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 16,
  },
  stepDot: {
    height: 6,
    width: 24,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
  },
  stepDotActive: {
    height: 6,
    width: 32,
    borderRadius: 3,
    backgroundColor: SymptomColors.primary,
    marginHorizontal: 4,
  },
  optionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: SymptomColors.border,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderWidth: 1,
    borderColor: SymptomColors.primary,
    borderRadius: 16,
    padding: 18,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
});
