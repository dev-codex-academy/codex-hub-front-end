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
      // Applicants have no group assignments — send them to CodeX Hub
      const isApplicant = !me.is_staff && (!me.groups || me.groups.length === 0)
      navigate(isApplicant ? '/codexhub/students' : '/dashboard')
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
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brandline">
          {/* <img className="auth-brand-logo" src="/codeX-logo.png" alt="CodeX logo" /> */}
          <div>
            <p className="auth-app">CodeX Hub</p>
            <p className="auth-tag">People operations, made simple.</p>
          </div>
        </div>

        {/* <header className="auth-form-header">
          <p style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.3em', color: '#E06C75', textTransform: 'uppercase', margin: 0 }}>
            CodeX Academy
          </p>
          <h2>Welcome back</h2>
          <p>Sign in to manage your courses, applications, and events.</p>
        </header> */}

        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '28px' }}>
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
              type="text"
              name="username"
              autoComplete="username"
              placeholder="jdoe"
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

          <div style={{ marginBottom: '16px' }}>
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
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
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

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '22px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" name="remember" style={{ width: '15px', height: '15px', accentColor: '#4E89BD' }} />
              Remember me
            </label>
          </div>

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

          <p style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px', color: '#64748b' }}>
            New to CodeX Academy?{' '}
            <Link to="/register" style={{ color: '#4E89BD', fontWeight: '700', textDecoration: 'none' }}>
              Create an account
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

