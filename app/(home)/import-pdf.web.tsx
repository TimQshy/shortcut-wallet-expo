import { useUser } from '@clerk/expo'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  Text, View, Pressable, StyleSheet, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { C, R, S } from '../../constants/theme'
import { PDF_URL } from '../../constants/api'

const CATEGORIES = ['food','transport','shopping','health','entertainment','utilities','salary','freelance','investment','other'] as const
type Category = typeof CATEGORIES[number]

const CATEGORY_LABELS: Record<Category, string> = {
  food: '🍔 Еда', transport: '🚗 Транспорт', shopping: '🛍 Покупки',
  health: '❤️ Здоровье', entertainment: '🎬 Развлечения', utilities: '⚡ ЖКХ',
  salary: '💵 Зарплата', freelance: '💻 Фриланс', investment: '📈 Инвестиции',
  other: '⭕ Другое',
}

type ParsedTx = {
  date: string
  title: string
  amount: number
  category: Category
}

function formatMoney(amount: number) {
  return Math.abs(amount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ImportPdfPage() {
  const { user } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{ accountId: string; accountName: string }>()
  const inputRef = useRef<HTMLInputElement>(null)

  const [stage, setStage] = useState<'pick' | 'parsing' | 'preview' | 'importing'>('pick')
  const [transactions, setTransactions] = useState<ParsedTx[]>([])
  const [skippedCount, setSkippedCount] = useState(0)
  const [editingCategory, setEditingCategory] = useState<number | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setStage('parsing')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('account_id', params.accountId)
      formData.append('user_id', user!.id)

      const res = await fetch(`${PDF_URL}/parse`, { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.message || 'Ошибка парсинга')

      setTransactions(data.new)
      setSkippedCount(data.skipped_count)
      setStage('preview')
    } catch (err: any) {
      setStage('pick')
      Alert.alert('Ошибка', err.message)
    }
  }

  const updateCategory = (index: number, category: Category) => {
    setTransactions(prev => prev.map((tx, i) => i === index ? { ...tx, category } : tx))
    setEditingCategory(null)
  }

  const removeTransaction = (index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index))
  }

  const importAll = async () => {
    if (!transactions.length) return
    setStage('importing')
    try {
      const res = await fetch(`${PDF_URL}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          account_id: params.accountId,
          user_id: user!.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      Alert.alert('Готово', `Импортировано ${data.imported} транзакций`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (err: any) {
      setStage('preview')
      Alert.alert('Ошибка импорта', err.message)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={C.onBackground} />
        </Pressable>
        <Text style={styles.headerTitle}>Импорт выписки</Text>
        <View style={{ width: 44 }} />
      </View>

      {stage === 'pick' && (
        <View style={styles.center}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-attach-outline" size={52} color={C.onPrimaryContainer} />
          </View>
          <Text style={styles.pickTitle}>Загрузи выписку банка</Text>
          <Text style={styles.pickSub}>PDF файл — Gemini распарсит транзакции{'\n'}и добавит только новые</Text>
          <Pressable style={styles.primaryBtn} onPress={() => inputRef.current?.click()}>
            <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
            <Text style={styles.primaryBtnText}>Выбрать PDF</Text>
          </Pressable>
        </View>
      )}

      {stage === 'parsing' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primaryContainer} />
          <Text style={styles.parsingText}>Gemini анализирует выписку…</Text>
          <Text style={styles.parsingSub}>Обычно занимает 5–15 секунд</Text>
        </View>
      )}

      {stage === 'preview' && (
        <>
          <ScrollView contentContainerStyle={styles.previewContent} showsVerticalScrollIndicator={false}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryPill}>
                <Text style={styles.summaryNum}>{transactions.length}</Text>
                <Text style={styles.summaryLabel}>новых</Text>
              </View>
              {skippedCount > 0 && (
                <View style={[styles.summaryPill, styles.summaryPillSkipped]}>
                  <Text style={[styles.summaryNum, styles.summaryNumSkipped]}>{skippedCount}</Text>
                  <Text style={[styles.summaryLabel, styles.summaryLabelSkipped]}>уже есть</Text>
                </View>
              )}
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyPreview}>
                <Ionicons name="checkmark-circle-outline" size={48} color={C.outlineVariant} />
                <Text style={styles.emptyText}>Все транзакции уже есть в счёте</Text>
              </View>
            ) : (
              transactions.map((tx, i) => {
                const isIncome = tx.amount > 0
                return (
                  <View key={i} style={styles.txCard}>
                    <View style={styles.txTop}>
                      <Text style={styles.txTitle} numberOfLines={1}>{tx.title}</Text>
                      <Pressable onPress={() => removeTransaction(i)} hitSlop={8}>
                        <Ionicons name="close-circle-outline" size={20} color={C.outline} />
                      </Pressable>
                    </View>
                    <View style={styles.txBottom}>
                      <Pressable
                        style={styles.catChip}
                        onPress={() => setEditingCategory(editingCategory === i ? null : i)}
                      >
                        <Text style={styles.catChipText}>{CATEGORY_LABELS[tx.category]}</Text>
                        <Ionicons name="chevron-down" size={12} color={C.onSurfaceVariant} />
                      </Pressable>
                      <Text style={styles.txDate}>{tx.date}</Text>
                      <Text style={[styles.txAmount, { color: isIncome ? C.income : C.expense }]}>
                        {isIncome ? '+' : '-'}{formatMoney(Math.abs(tx.amount))} ₽
                      </Text>
                    </View>
                    {editingCategory === i && (
                      <View style={styles.catPicker}>
                        {CATEGORIES.map(cat => (
                          <Pressable key={cat} style={styles.catOption} onPress={() => updateCategory(i, cat)}>
                            <Text style={[styles.catOptionText, tx.category === cat && styles.catOptionActive]}>
                              {CATEGORY_LABELS[cat]}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                )
              })
            )}
          </ScrollView>

          {transactions.length > 0 && (
            <View style={styles.footer}>
              <Pressable style={styles.importBtn} onPress={importAll}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.importBtnText}>Импортировать {transactions.length} транзакций</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {stage === 'importing' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primaryContainer} />
          <Text style={styles.parsingText}>Сохраняю транзакции…</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: S.containerMargin, paddingVertical: S.lg,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.onBackground },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: S.containerMargin },
  iconWrap: {
    width: 100, height: 100, borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: S.xl,
  },
  pickTitle: { fontSize: 20, fontWeight: '700', color: C.onBackground, marginBottom: S.sm, textAlign: 'center' },
  pickSub: { fontSize: 14, color: C.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: S.xl },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: S.sm,
    backgroundColor: C.primaryContainer, borderRadius: R.md,
    paddingVertical: 14, paddingHorizontal: S.xl,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  parsingText: { fontSize: 16, fontWeight: '600', color: C.onBackground, marginTop: S.lg },
  parsingSub: { fontSize: 13, color: C.onSurfaceVariant, marginTop: S.sm },
  previewContent: { paddingHorizontal: S.containerMargin, paddingBottom: 120 },
  summaryRow: { flexDirection: 'row', gap: S.sm, marginBottom: S.lg },
  summaryPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.primaryContainer, borderRadius: R.full,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  summaryPillSkipped: { backgroundColor: C.surfaceContainerHigh },
  summaryNum: { fontSize: 16, fontWeight: '700', color: '#fff' },
  summaryNumSkipped: { color: C.onSurfaceVariant },
  summaryLabel: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  summaryLabelSkipped: { color: C.onSurfaceVariant },
  emptyPreview: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600', color: C.onSurfaceVariant },
  txCard: {
    backgroundColor: C.surfaceContainerLow, borderRadius: R.lg, padding: S.md,
    marginBottom: S.sm, borderWidth: 1, borderColor: C.outlineVariant,
  },
  txTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  txTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: C.onBackground },
  txBottom: { flexDirection: 'row', alignItems: 'center', gap: S.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: C.surfaceContainerHigh, borderRadius: R.full,
    paddingVertical: 4, paddingHorizontal: 10,
  },
  catChipText: { fontSize: 12, color: C.onSurfaceVariant },
  txDate: { fontSize: 12, color: C.outline, flex: 1 },
  txAmount: { fontSize: 14, fontWeight: '700' },
  catPicker: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: S.sm,
    paddingTop: S.sm, borderTopWidth: 1, borderTopColor: C.outlineVariant,
  },
  catOption: {
    backgroundColor: C.surfaceContainerHigh, borderRadius: R.full,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  catOptionText: { fontSize: 12, color: C.onSurfaceVariant },
  catOptionActive: { color: C.primaryContainer, fontWeight: '700' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: S.containerMargin, backgroundColor: C.background },
  importBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: S.sm,
    backgroundColor: C.primaryContainer, borderRadius: R.md, paddingVertical: 16,
  },
  importBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
})
