import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/context/AuthContext'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setError('')
    setLoading(true)
    try {
      const me = await login(data.username, data.password)
      // Applicants have no group assignments — send them to their profile
      const isApplicant = !me.is_staff && (!me.groups || me.groups.length === 0)
      navigate(isApplicant ? '/profile' : '/dashboard')
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0]
        || err.response?.data?.detail
        || 'Invalid credentials. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e8f2f9 100%)',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #4E89BD, #61AFEE)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            color: 'white',
            fontSize: '18px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(78,137,189,0.35)',
          }}>
            HR
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>
            HR Portal
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
          padding: '36px',
          border: '1px solid rgba(78,137,189,0.12)',
        }}>
          <form onSubmit={handleSubmit(onSubmit)}>

            {error && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '24px',
                color: '#dc2626',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}

            {/* Username field */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '8px',
              }}>
                Username
              </label>
              <input
                placeholder="Enter your username"
                autoComplete="username"
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  border: errors.username ? '2px solid #dc2626' : '2px solid #e2e8f0',
                  padding: '0 14px',
                  fontSize: '15px',
                  color: '#1e293b',
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = '#4E89BD'}
                onBlur={e => e.target.style.borderColor = errors.username ? '#dc2626' : '#e2e8f0'}
                {...register('username', { required: 'Username is required' })}
              />
              {errors.username && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password field */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Password
                </label>
                <Link
                  to="/password-reset"
                  style={{ fontSize: '13px', color: '#4E89BD', textDecoration: 'none', fontWeight: '500' }}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  border: errors.password ? '2px solid #dc2626' : '2px solid #e2e8f0',
                  padding: '0 14px',
                  fontSize: '15px',
                  color: '#1e293b',
                  background: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#4E89BD'}
                onBlur={e => e.target.style.borderColor = errors.password ? '#dc2626' : '#e2e8f0'}
                {...register('password', { required: 'Password is required' })}
              />
              {errors.password && (
                <p style={{ color: '#dc2626', fontSize: '13px', marginTop: '6px' }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                background: loading ? '#93b8d8' : 'linear-gradient(135deg, #4E89BD, #61AFEE)',
                color: 'white',
                fontWeight: '700',
                fontSize: '16px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(78,137,189,0.40)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'opacity 0.15s',
              }}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Register link */}
          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#4E89BD', fontWeight: '700', textDecoration: 'none' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
