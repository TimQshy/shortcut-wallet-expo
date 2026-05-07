import { useUser, useClerk } from '@clerk/expo'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback } from 'react'
import {
  Text, View, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTransactions } from '../../hooks/use-transactions'
import { C, R, S } from '../../constants/theme'

const CATEGORY_ICONS: Record<string, any> = {
  food: 'restaurant-outline',
  transport: 'car-outline',
  shopping: 'bag-handle-outline',
  entertainment: 'film-outline',
  health: 'heart-outline',
  utilities: 'flash-outline',
  salary: 'cash-outline',
  freelance: 'laptop-outline',
  investment: 'trending-up-outline',
  other: 'ellipsis-horizontal-circle-outline',
}

function getCategoryIcon(category: string) {
  return CATEGORY_ICONS[category?.toLowerCase()] ?? CATEGORY_ICONS.other
}

function formatMoney(amount: number) {
  return Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function HomePage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { transactions, summary, isLoading, loadData, deleteTransaction } = useTransactions(user?.id)

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [loadData])
  )

  const firstName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    'there'
  const initials = firstName[0]?.toUpperCase() ?? '?'

  const balance = Number(summary.balance ?? 0)
  const income = Number(summary.income ?? 0)
  const expenses = Math.abs(Number(summary.expenses ?? 0))

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>GOOD MORNING</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <Pressable
            style={styles.avatar}
            onPress={() =>
              Alert.alert('Sign out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
              ])
            }
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        </View>

        {/* ── Balance Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TOTAL BALANCE</Text>
          <Text style={styles.cardBalance}>${formatMoney(balance)}</Text>

          <View style={styles.cardRow}>
            <View style={styles.cardPill}>
              <View style={styles.pillIcon}>
                <Ionicons name="arrow-down" size={14} color="#81c784" />
              </View>
              <View>
                <Text style={styles.pillLabel}>INCOME</Text>
                <Text style={styles.pillValue}>${formatMoney(income)}</Text>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardPill}>
              <View style={styles.pillIcon}>
                <Ionicons name="arrow-up" size={14} color="#ffb74d" />
              </View>
              <View>
                <Text style={styles.pillLabel}>EXPENSES</Text>
                <Text style={styles.pillValue}>${formatMoney(expenses)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <Text style={styles.txCount}>{transactions.length} total</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={C.primaryContainer} style={{ marginTop: 48 }} />
          ) : transactions.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={C.outlineVariant} />
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptySub}>Tap + to add your first one</Text>
            </View>
          ) : (
            transactions.map((tx: any) => {
              const isIncome = tx.amount > 0
              const dateStr = formatDate(tx.created_at)
              const meta = [tx.category, dateStr].filter(Boolean).join(' · ')
              return (
                <Pressable
                  key={tx.id}
                  style={styles.txRow}
                  onLongPress={() =>
                    Alert.alert('Delete', `Delete "${tx.title}"?`, [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => deleteTransaction(tx.id),
                      },
                    ])
                  }
                >
                  <View style={styles.txIcon}>
                    <Ionicons
                      name={getCategoryIcon(tx.category)}
                      size={20}
                      color={C.secondary}
                    />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.title}
                    </Text>
                    <Text style={styles.txMeta}>{meta}</Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: isIncome ? C.income : C.expense },
                    ]}
                  >
                    {isIncome ? '+' : '-'}${formatMoney(Math.abs(Number(tx.amount)))}
                  </Text>
                </Pressable>
              )
            })
          )}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(home)/create' as any)}
      >
        <Ionicons name="add" size={30} color="#ffffff" />
      </Pressable>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: S.containerMargin,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: S.lg,
    marginBottom: S.lg,
  },
  greeting: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: C.onBackground,
    marginTop: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },

  card: {
    backgroundColor: C.primaryContainer,
    borderRadius: R.xl,
    padding: S.xl,
    marginBottom: S.xl,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onPrimaryContainer,
    letterSpacing: 1.2,
    marginBottom: S.sm,
  },
  cardBalance: {
    fontSize: 42,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: S.xl,
  },
  cardRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: R.lg,
    paddingVertical: S.md,
    paddingHorizontal: S.md,
  },
  cardPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillIcon: {
    width: 28,
    height: 28,
    borderRadius: R.full,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: S.md,
  },
  pillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.onPrimaryContainer,
    letterSpacing: 0.8,
  },
  pillValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },

  section: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: S.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.onBackground,
  },
  txCount: {
    fontSize: 13,
    fontWeight: '500',
    color: C.onSurfaceVariant,
  },

  empty: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.onSurfaceVariant,
    marginTop: S.sm,
  },
  emptySub: {
    fontSize: 13,
    color: C.outline,
  },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainerHigh,
    gap: S.md,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
    gap: 3,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: C.onBackground,
  },
  txMeta: {
    fontSize: 12,
    color: C.onSurfaceVariant,
    textTransform: 'capitalize',
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },

  fab: {
    position: 'absolute',
    right: S.containerMargin,
    bottom: 36,
    width: 62,
    height: 62,
    borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 10,
  },
})
