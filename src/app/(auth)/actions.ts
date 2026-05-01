'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

type ActionResult = { error: string } | { success: true; message?: string }

export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { error: error.message }
    }
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' }
  }

  redirect('/dashboard')
}

export async function signUp(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const full_name = formData.get('full_name') as string

  if (!email || !password || !username || !full_name) {
    return { error: 'All fields are required.' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          full_name,
        },
      },
    })

    if (error) {
      return { error: error.message }
    }

    return {
      success: true,
      message: 'Check your email to confirm your account.',
    }
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function signOut(): Promise<never> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}

export async function updateProfile(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { error: 'You must be signed in to update your profile.' }
    }

    const updates: Record<string, string | null> = {}

    const fields = ['username', 'full_name', 'bio', 'location', 'instagram_handle']
    for (const field of fields) {
      const value = formData.get(field)
      if (value !== null) {
        updates[field] = (value as string).trim() || null
      }
    }

    updates.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      return { error: error.message }
    }

    return { success: true, message: 'Profile updated.' }
  } catch {
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
