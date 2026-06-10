import { useUser } from '@clerk/expo'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Text, View, Pressable, StyleSheet, TextInput,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAccounts } from '../../hooks/use-accounts'
import { C, R, S } from '../../constants/theme'

export default function CreateAccountPage() {
  const { user } = useUser()
  const router = useRouter()
  const { createAccount } = useAccounts()

  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Ошибка', 'Введите название счёта')
      return
    }
    if (!user?.id) return
    setSubmitting(true)
    const result = await createAccount(user.id, name.trim())
    setSubmitting(false)
    if (result) router.back()
  }

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
            <Text style={styles.headerTitle}>Новый счёт</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Icon */}
          <View style={styles.iconWrap}>
            <Ionicons name="wallet-outline" size={48} color={C.onPrimaryContainer} />
          </View>

          {/* Name field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>НАЗВАНИЕ СЧЁТА</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="например: Молодежка"
              placeholderTextColor={C.outline}
              returnKeyType="done"
              autoFocus
              onSubmitEditing={handleSubmit}
            />
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, (!name.trim() || submitting) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim() || submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Создание…' : 'Создать счёт'}
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
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: C.onBackground },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: R.full,
    backgroundColor: C.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: S.xl,
    marginTop: S.lg,
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

  submitBtn: {
    backgroundColor: C.primaryContainer,
    borderRadius: R.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: S.sm,
  },
  submitDisabled: { opacity: 0.38 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 },
})
