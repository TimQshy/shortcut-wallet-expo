import { useAuth, useSignUp } from '@clerk/expo'
import { type Href, Link, useRouter } from 'expo-router'
import React from 'react'
import {
  Pressable, StyleSheet, Text, TextInput, View,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { C, R, S } from '../../constants/theme'

export default function SignUpPage() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const { isSignedIn } = useAuth()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [code, setCode] = React.useState('')
  const [passwordVisible, setPasswordVisible] = React.useState(false)

  const handleSubmit = async () => {
    const { error } = await signUp.password({ emailAddress, password })
    if (error) { console.error(JSON.stringify(error, null, 2)); return }
    if (!error) await signUp.verifications.sendEmailCode()
  }

  const handleVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code })
    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) { console.log(session?.currentTask); return }
          const url = decorateUrl('/')
          if (url.startsWith('http')) { window.location.href = url } else { router.push(url as Href) }
        },
      })
    } else {
      console.error('Sign-up attempt not complete:', signUp)
    }
  }

  if (signUp.status === 'complete' || isSignedIn) return null

  if (
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0
  ) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.illustration}>
            <View style={styles.illustrationRing}>
              <Ionicons name="mail-outline" size={40} color={C.primaryContainer} />
            </View>
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a code to {emailAddress}. Enter it below to confirm your account.
          </Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>VERIFICATION CODE</Text>
            <TextInput
              style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
              value={code}
              placeholder="000000"
              placeholderTextColor={C.outline}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
            />
            {errors?.fields?.code && (
              <Text style={styles.errorText}>{errors.fields.code.message}</Text>
            )}
          </View>

          <Pressable
            style={[styles.primaryBtn, fetchStatus === 'fetching' && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={fetchStatus === 'fetching'}
          >
            <Text style={styles.primaryBtnText}>
              {fetchStatus === 'fetching' ? 'Verifying…' : 'Verify email'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => signUp.verifications.sendEmailCode()}
          >
            <Text style={styles.secondaryBtnText}>Resend code</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
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
          {/* Illustration */}
          <View style={styles.illustration}>
            <View style={styles.illustrationRing}>
              <Ionicons name="trending-up-outline" size={40} color={C.primaryContainer} />
            </View>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Start your journey to mindful spending.</Text>

          {/* Email */}
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
            {errors?.fields?.emailAddress && (
              <Text style={styles.errorText}>{errors.fields.emailAddress.message}</Text>
            )}
          </View>

          {/* Password */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={password}
                placeholder="Create a password"
                placeholderTextColor={C.outline}
                secureTextEntry={!passwordVisible}
                onChangeText={setPassword}
                autoComplete="new-password"
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
            {errors?.fields?.password && (
              <Text style={styles.errorText}>{errors.fields.password.message}</Text>
            )}
          </View>

          <Pressable
            style={[
              styles.primaryBtn,
              (!emailAddress || !password || fetchStatus === 'fetching') && styles.btnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!emailAddress || !password || fetchStatus === 'fetching'}
          >
            <Text style={styles.primaryBtnText}>
              {fetchStatus === 'fetching' ? 'Creating account…' : 'Create account'}
            </Text>
          </Pressable>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href="/(auth)/sign-in">
              <Text style={styles.linkAction}>Sign in</Text>
            </Link>
          </View>

          {/* Required for Clerk bot protection */}
          <View nativeID="clerk-captcha" />
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
