import { useClerk, useSignIn } from '@clerk/expo'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import {
  Pressable, StyleSheet, Text, TextInput, View,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { C, R, S } from '../../constants/theme'

export default function SignInPage() {
  const { signIn, isLoaded } = useSignIn()
  const { setActive } = useClerk()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [passwordVisible, setPasswordVisible] = React.useState(false)

  const handleSubmit = async () => {
    if (!isLoaded || loading) return
    setLoading(true)
    setError('')
    try {
      const result = await signIn.create({ identifier: emailAddress, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/(home)')
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message ?? err.message ?? 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.illustration}>
            <View style={styles.illustrationRing}>
              <Ionicons name="wallet-outline" size={40} color={C.primaryContainer} />
            </View>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Track your finances mindfully.</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="you@example.com"
              placeholderTextColor={C.outline}
              onChangeText={setEmailAddress}
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={password}
                placeholder="Your password"
                placeholderTextColor={C.outline}
                secureTextEntry={!passwordVisible}
                onChangeText={setPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setPasswordVisible(!passwordVisible)}
                hitSlop={8}
              >
                <Ionicons
                  name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={C.outline}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={[
              styles.primaryBtn,
              (!emailAddress || !password || loading) && styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!emailAddress || !password || loading}
          >
            <Text style={styles.primaryBtnText}>
              {loading ? 'Signing in…' : 'Continue'}
            </Text>
          </Pressable>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <Link href="/(auth)/sign-up">
              <Text style={styles.linkAction}>Sign up</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  container: {
    paddingHorizontal: S.containerMargin,
    paddingBottom: 48,
  },

  illustration: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
  },
  illustrationRing: {
    width: 110,
    height: 110,
    borderRadius: R.full,
    backgroundColor: C.surfaceContainerLow,
    borderWidth: 8,
    borderColor: C.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: C.onBackground,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: C.onSurfaceVariant,
    marginBottom: S.xl,
    lineHeight: 24,
  },

  field: { marginBottom: S.lg },
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
  inputWrapper: {
    position: 'relative',
  },
  inputWithIcon: {
    paddingRight: 48,
  },
  eyeBtn: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  errorText: {
    fontSize: 12,
    color: C.error,
    marginTop: 6,
    fontWeight: '500',
  },

  primaryBtn: {
    backgroundColor: C.primaryContainer,
    borderRadius: R.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: S.sm,
    marginBottom: S.md,
  },
  btnDisabled: { opacity: 0.38 },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },

  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.secondary,
  },

  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: S.md,
  },
  linkText: {
    fontSize: 14,
    color: C.onSurfaceVariant,
  },
  linkAction: {
    fontSize: 14,
    fontWeight: '700',
    color: C.secondary,
  },
})
