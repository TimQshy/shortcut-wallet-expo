import { useUser } from '@clerk/expo'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Text, View, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTransactions } from '../../hooks/use-transactions'
import { useNotes } from '../../hooks/use-notes'
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
  return Math.abs(amount).toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

type Tab = 'transactions' | 'notes'

export default function AccountPage() {
  const { user } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{ accountId: string; accountName: string }>()
  const accountId = params.accountId
  const accountName = params.accountName ?? 'Счёт'

  const { transactions, summary, isLoading: txLoading, loadData, deleteTransaction } = useTransactions(user?.id, accountId)
  const { notes, isLoading: notesLoading, loadNotes, deleteNote } = useNotes()
  const [activeTab, setActiveTab] = useState<Tab>('transactions')

  useFocusEffect(
    useCallback(() => {
      if (user?.id && accountId) {
        loadData()
        loadNotes(accountId)
      }
    }, [user?.id, accountId, loadData, loadNotes])
  )

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
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={C.onBackground} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{accountName}</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>БАЛАНС</Text>
          <Text style={styles.cardBalance}>{formatMoney(balance)} ₽</Text>

          <View style={styles.cardRow}>
            <View style={styles.cardPill}>
              <View style={styles.pillIcon}>
                <Ionicons name="arrow-down" size={14} color="#81c784" />
              </View>
              <View>
                <Text style={styles.pillLabel}>ДОХОДЫ</Text>
                <Text style={styles.pillValue}>{formatMoney(income)} ₽</Text>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardPill}>
              <View style={styles.pillIcon}>
                <Ionicons name="arrow-up" size={14} color="#ffb74d" />
              </View>
              <View>
                <Text style={styles.pillLabel}>РАСХОДЫ</Text>
                <Text style={styles.pillValue}>{formatMoney(expenses)} ₽</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
            onPress={() => setActiveTab('transactions')}
          >
            <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
              Транзакции
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
            onPress={() => setActiveTab('notes')}
          >
            <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>
              Заметки
            </Text>
          </Pressable>
        </View>

        {/* Transactions tab */}
        {activeTab === 'transactions' && (
          <View style={styles.section}>
            {txLoading ? (
              <ActivityIndicator size="small" color={C.primaryContainer} style={{ marginTop: 32 }} />
            ) : transactions.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="receipt-outline" size={40} color={C.outlineVariant} />
                <Text style={styles.emptyTitle}>Нет транзакций</Text>
                <Text style={styles.emptySub}>Нажмите + чтобы добавить</Text>
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
                    onPress={() =>
                      router.push({
                        pathname: '/(home)/edit' as any,
                        params: {
                          id: tx.id,
                          title: tx.title,
                          amount: tx.amount,
                          category: tx.category,
                        },
                      })
                    }
                    onLongPress={() =>
                      Alert.alert('Удалить', `Удалить "${tx.title}"?`, [
                        { text: 'Отмена', style: 'cancel' },
                        {
                          text: 'Удалить',
                          style: 'destructive',
                          onPress: () => deleteTransaction(tx.id),
                        },
                      ])
                    }
                  >
                    <View style={styles.txIcon}>
                      <Ionicons name={getCategoryIcon(tx.category)} size={20} color={C.secondary} />
                    </View>
                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                      <Text style={styles.txMeta}>{meta}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: isIncome ? C.income : C.expense }]}>
                      {isIncome ? '+' : '-'}{formatMoney(Math.abs(Number(tx.amount)))} ₽
                    </Text>
                  </Pressable>
                )
              })
            )}
          </View>
        )}

        {/* Notes tab */}
        {activeTab === 'notes' && (
          <View style={styles.section}>
            {notesLoading ? (
              <ActivityIndicator size="small" color={C.primaryContainer} style={{ marginTop: 32 }} />
            ) : notes.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="document-text-outline" size={40} color={C.outlineVariant} />
                <Text style={styles.emptyTitle}>Нет заметок</Text>
                <Text style={styles.emptySub}>Нажмите + чтобы добавить заметку</Text>
              </View>
            ) : (
              notes.map((note) => (
                <Pressable
                  key={note.id}
                  style={styles.noteCard}
                  onLongPress={() =>
                    Alert.alert('Удалить заметку', 'Удалить эту заметку?', [
                      { text: 'Отмена', style: 'cancel' },
                      {
                        text: 'Удалить',
                        style: 'destructive',
                        onPress: () => deleteNote(note.id),
                      },
                    ])
                  }
                >
                  <Text style={styles.noteContent}>{note.content}</Text>
                  <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
                </Pressable>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB — two action buttons */}
      <View style={styles.fabContainer}>
        <Pressable
          style={[styles.fabSmall]}
          onPress={() =>
            router.push({
              pathname: '/(home)/create-note' as any,
              params: { accountId },
            })
          }
        >
          <Ionicons name="document-text-outline" size={20} color="#ffffff" />
          <Text style={styles.fabSmallText}>Заметка</Text>
        </Pressable>
        <Pressable
          style={styles.fab}
          onPress={() =>
            router.push({
              pathname: '/(home)/create' as any,
              params: { accountId, accountName },
            })
          }
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: S.containerMargin,
    paddingBottom: 120,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: S.lg,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: C.onBackground,
    textAlign: 'center',
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
    fontSize: 38,
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
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 1,
  },

  tabs: {
    flexDirection: 'row',
    backgroundColor: C.surfaceContainerHigh,
    borderRadius: R.full,
    padding: 4,
    marginBottom: S.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: R.full,
  },
  tabActive: {
    backgroundColor: C.primaryContainer,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.onSurfaceVariant,
  },
  tabTextActive: {
    color: '#ffffff',
  },

  section: {},

  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
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
    width: 44,
    height: 44,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, gap: 3 },
  txTitle: { fontSize: 15, fontWeight: '600', color: C.onBackground },
  txMeta: { fontSize: 12, color: C.onSurfaceVariant, textTransform: 'capitalize' },
  txAmount: { fontSize: 14, fontWeight: '700' },

  noteCard: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    gap: 6,
  },
  noteContent: {
    fontSize: 15,
    color: C.onBackground,
    lineHeight: 22,
  },
  noteDate: {
    fontSize: 12,
    color: C.onSurfaceVariant,
  },

  fabContainer: {
    position: 'absolute',
    right: S.containerMargin,
    bottom: 36,
    alignItems: 'center',
    gap: S.sm,
  },
  fabSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.secondary,
    borderRadius: R.full,
    paddingVertical: 10,
    paddingHorizontal: S.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  fabSmallText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  fab: {
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
