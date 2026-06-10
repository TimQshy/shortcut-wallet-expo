import { useUser } from '@clerk/expo'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  Text, View, Pressable, StyleSheet, TextInput,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNotes } from '../../hooks/use-notes'
import { C, R, S } from '../../constants/theme'

export default function CreateNotePage() {
  const { user } = useUser()
  const router = useRouter()
  const params = useLocalSearchParams<{ accountId: string }>()
  const { createNote } = useNotes()

  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Ошибка', 'Введите текст заметки')
      return
    }
    if (!user?.id || !params.accountId) return
    setSubmitting(true)
    const result = await createNote(user.id, params.accountId, content.trim())
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
            <Text style={styles.headerTitle}>Новая заметка</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Content field */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ТЕКСТ ЗАМЕТКИ</Text>
            <TextInput
              style={styles.textArea}
              value={content}
              onChangeText={setContent}
              placeholder="Введите заметку…"
              placeholderTextColor={C.outline}
              multiline
              numberOfLines={8}
              autoFocus
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitBtn, (!content.trim() || submitting) && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!content.trim() || submitting}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Сохранение…' : 'Сохранить заметку'}
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

  field: { marginBottom: S.xl },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.onSurfaceVariant,
    letterSpacing: 1.2,
    marginBottom: S.sm,
  },
  textArea: {
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 1,
    borderColor: C.outlineVariant,
    borderRadius: R.md,
    paddingHorizontal: S.md,
    paddingVertical: 14,
    fontSize: 16,
    color: C.onBackground,
    minHeight: 180,
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
