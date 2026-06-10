import { useUser } from '@clerk/expo'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Text, View, Pressable, StyleSheet, TextInput,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTransactions } from '../../hooks/use-transactions'
import { C, R, S } from '../../constants/theme'

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: 'restaurant-outline' },
  { id: 'transport', label: 'Transport', icon: 'car-outline' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline' },
  { id: 'health', label: 'Health', icon: 'heart-outline' },
  { id: 'entertainment', label: 'Fun', icon: 'film-outline' },
  { id: 'utilities', label: 'Bills', icon: 'flash-outline' },
  { id: 'salary', label: 'Salary', icon: 'cash-outline' },
  { id: 'freelance', label: 'Freelance', icon: 'laptop-outline' },
  { id: 'investment', label: 'Invest', icon: 'trending-up-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
] as const

type TxType = 'expense' | 'income'

export default function CreatePage() {
  const { user } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{ accountId: string; accountName: string }>()
  const accountId = params.accountId
  const { createTransaction } = useTransactions(user?.id, accountId)

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !amount || !category) {
      Alert.alert('Missing fields', 'Please fill in all fields and select a category.')
      return
    }
    const numeric = parseFloat(amount)
    if (isNaN(numeric) || numeric <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.')
      return
    }
    setSubmitting(true)
    const finalAmount = type === 'expense' ? -numeric : numeric
    const success = await createTransaction({ title: title.trim(), amount: finalAmount, category })
    setSubmitting(false)
    if (success) router.back()
  }

  const rows = [CATEGORIES.slice(0, 5), CATEGORIES.slice(5)] as const

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color={C.onBackground} />
            </Pressable>
            <Text style={styles.headerTitle}>New Transaction</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Type Toggle */}
          <View style={styles.toggle}>
            <Pressable
              style={[styles.toggleBtn, type === 'expense' && styles.toggleExpense]}
              onPress={() => setType('expense')}
            >
              <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>
                Expense
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, type === 'income' && styles.toggleIncome]}
              onPress={() => setType('income')}
            >
              <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>
                Income
              </Text>
            </Pressable>
          </View>

          {/* Amount Display */}
          <View style={styles.amountRow}>
            <Text style={[styles.currency, { color: amount ? C.onSurfaceVariant : C.outlineVariant }]}>
              $
            </Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={C.outlineVariant}
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Coffee at Blue Bottle"
              placeholderTextColor={C.outline}
              returnKeyType="done"
            />
          </View>

          {/* Category Grid */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>CATEGORY</Text>
            <View style={styles.grid}>
              {rows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((cat) => {
                    const selected = category === cat.id
                    return (
                      <Pressable
                        key={cat.id}
                        style={styles.catItem}
                        onPress={() => setCategory(cat.id)}
                      >
                        <View style={[styles.catIcon, selected && styles.catIconSelected]}>
                          <Ionicons
                            name={cat.icon as any}
                            size={22}
                            color={selected ? '#ffffff' : C.secondary}
                          />
                        </View>
                        <Text style={[styles.catLabel, selected && styles.catLabelSelected]}>
                          {cat.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
              ))}
            </View>
          </View>

          {/* Submit */}
          <Pressable
            style={[
              styles.submitBtn,
              (!title || !amount || !category || submitting) && styles.submitDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!title || !amount || !category || submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Adding…' : 'Add Transaction'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  content: {
    paddingHorizontal: S.containerMargin,
    paddingBottom: 48,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: S.lg,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.onBackground,
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: R.full,
    padding: 4,
    marginBottom: S.xl,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: R.full,
  },
  toggleExpense: {
    backgroundColor: C.expense,
  },
  toggleIncome: {
    backgroundColor: C.income,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  toggleTextActive: {
    color: '#ffffff',
  },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: S.xl,
    gap: 4,
  },
  currency: {
    fontSize: 36,
    fontWeight: '700',
    paddingBottom: 8,
  },
  amountInput: {
    fontSize: 60,
    fontWeight: '700',
    color: C.onBackground,
    minWidth: 120,
    textAlign: 'left',
    letterSpacing: -1,
  },

  field: { marginBottom: S.xl },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: S.sm,
  },
  input: {
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 14,
    fontSize: 16,
    color: C.onBackground,
  },

  grid: { gap: S.md },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  catIcon: {
    width: 52,
    height: 52,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIconSelected: {
    backgroundColor: C.primaryContainer,
    borderColor: C.primaryContainer,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    textAlign: 'center',
  },
  catLabelSelected: {
    color: C.primaryContainer,
    fontWeight: '700',
  },

  submitBtn: {
    backgroundColor: C.primaryContainer,
    borderRadius: R.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: S.sm,
  },
  submitDisabled: {
    opacity: 0.38,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
})
