import { useUser, useClerk } from '@clerk/expo'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback } from 'react'
import {
  Text, View, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAccounts } from '../../hooks/use-accounts'
import { C, R, S } from '../../constants/theme'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AccountsPage() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()
  const { accounts, isLoading, loadAccounts, deleteAccount } = useAccounts()

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadAccounts(user.id)
    }, [user?.id, loadAccounts])
  )

  const firstName =
    user?.firstName ??
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ??
    'there'
  const initials = firstName[0]?.toUpperCase() ?? '?'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>ДОБРО ПОЖАЛОВАТЬ</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.avatar}
              onPress={() =>
                Alert.alert('Выйти', 'Вы уверены?', [
                  { text: 'Отмена', style: 'cancel' },
                  { text: 'Выйти', style: 'destructive', onPress: () => signOut() },
                ])
              }
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </Pressable>
          </View>
        </View>

        {/* Accounts section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Счета</Text>
            <Text style={styles.countLabel}>{accounts.length} всего</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={C.primaryContainer} style={{ marginTop: 48 }} />
          ) : accounts.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={48} color={C.outlineVariant} />
              <Text style={styles.emptyTitle}>Нет счетов</Text>
              <Text style={styles.emptySub}>Нажмите + чтобы создать первый счёт</Text>
            </View>
          ) : (
            accounts.map((account) => (
              <Pressable
                key={account.id}
                style={styles.accountCard}
                onPress={() =>
                  router.push({
                    pathname: '/(home)/account' as any,
                    params: {
                      accountId: account.id,
                      accountName: account.name,
                    },
                  })
                }
                onLongPress={() =>
                  Alert.alert('Удалить счёт', `Удалить "${account.name}"? Все транзакции и заметки будут удалены.`, [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Удалить',
                      style: 'destructive',
                      onPress: async () => {
                        await deleteAccount(account.id)
                        if (user?.id) loadAccounts(user.id)
                      },
                    },
                  ])
                }
              >
                <View style={styles.accountIconWrap}>
                  <Ionicons name="wallet-outline" size={22} color={C.secondary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={styles.accountName}>{account.name}</Text>
                  <Text style={styles.accountDate}>Создан {formatDate(account.created_at)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.outlineVariant} />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => router.push('/(home)/create-account' as any)}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: S.sm,
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
  countLabel: {
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

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceContainerLow,
    borderRadius: R.lg,
    padding: S.md,
    marginBottom: S.sm,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    gap: S.md,
  },
  accountIconWrap: {
    width: 46,
    height: 46,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
    gap: 3,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.onBackground,
  },
  accountDate: {
    fontSize: 12,
    color: C.onSurfaceVariant,
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
