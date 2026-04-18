import React, { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart, MessageCircle, Send, Star, CircleUser, Newspaper,
  GraduationCap, ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import postService from '@/services/postService'
import studentSpotlightService from '@/services/studentSpotlightService'

const POST_TYPE_BADGE = {
  student_spotlight: { label: 'Student Spotlight', color: '#D97706', bg: '#FEF3C7' },
  announcement:      { label: 'Announcement',      color: '#7C3AED', bg: '#EDE9FE' },
  general:           { label: 'General',            color: '#4E89BD', bg: '#EFF6FF' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PostCard({ post, onToggleLike }) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments]         = useState([])
  const [loadingCmts, setLoadingCmts]   = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const inputRef = useRef(null)

  const badge    = POST_TYPE_BADGE[post.post_type] || POST_TYPE_BADGE.general
  const initials = (post.author_initials || post.author_name?.[0] || '?').toUpperCase()

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingCmts(true)
      try { const r = await postService.getComments(post.id); setComments(r.data?.results ?? r.data ?? []) } catch {}
      setLoadingCmts(false)
    }
    setShowComments(v => !v)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const r = await postService.addComment(post.id, { content: commentText.trim() })
      setComments(prev => [...prev, r.data])
      setCommentText('')
    } catch {}
    setSubmitting(false)
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: '16px' }}>
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#4E89BD,#3d6e98)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'white' }}>{initials}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{post.author_name || 'CodeX Academy'}</p>
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(post.created_at)}</p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '20px' }}>{badge.label}</span>
      </div>
      <div style={{ padding: '12px 16px' }}>
        {post.title && <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>{post.title}</p>}
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
      </div>
      {post.image_url && <img src={post.image_url} alt="" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', display: 'block' }} />}
      <div style={{ padding: '8px 16px', display: 'flex', gap: '16px', borderTop: post.image_url ? 'none' : '1px solid #F8FAFC' }}>
        <button onClick={() => onToggleLike(post.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: post.liked_by_me ? '#E06C75' : '#94A3B8', padding: '6px 0' }}>
          <Heart size={16} fill={post.liked_by_me ? '#E06C75' : 'none'} />{post.like_count > 0 && post.like_count}
        </button>
        <button onClick={toggleComments} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#94A3B8', padding: '6px 0' }}>
          <MessageCircle size={16} />{post.comment_count > 0 && post.comment_count}
        </button>
      </div>
      {showComments && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '0 16px 12px' }}>
          {loadingCmts ? <p style={{ fontSize: '12px', color: '#94A3B8', padding: '10px 0' }}>Loading…</p>
            : comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#64748B' }}>
                  {(c.author_initials || c.author_name?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '7px 10px', flex: 1 }}>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>{c.author_name}</p>
                  <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{c.content}</p>
                </div>
              </div>
            ))}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input ref={inputRef} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '20px', padding: '7px 14px', fontSize: '13px', outline: 'none', background: '#F8FAFC' }} />
            <button type="submit" disabled={submitting || !commentText.trim()} style={{ background: '#4E89BD', color: 'white', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !commentText.trim() ? 0.5 : 1 }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

const QUICK_LINKS = [
  { label: 'Student Spotlights', desc: 'Submit monthly feedback',  Icon: Star,          color: '#D97706', bg: '#FEF3C7', to: '/community/spotlights' },
  { label: 'My Profile',         desc: 'Your employee card',       Icon: CircleUser,    color: '#7C3AED', bg: '#F5F3FF', to: '/profile' },
  { label: 'My Courses',         desc: 'Teaching platform',        Icon: GraduationCap, color: '#F97316', bg: '#FFF7ED', href: 'https://moodle.mycodexacademy.com/login/index.php?lang=en_us', external: true },
]

export default function TeacherPage() {
  const { user } = useAuth()
  const [posts, setPosts]                 = useState([])
  const [postsLoading, setPostsLoading]   = useState(true)
  const [spotlights, setSpotlights]       = useState([])

  const groups = user?.groups ?? []
  const role   = groups.includes('TA') ? 'Teaching Assistant' : 'Teacher'
  const initials = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() || (user?.username?.[0] ?? 'T').toUpperCase()
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username

  useEffect(() => {
    postService.getAll({ ordering: '-created_at' })
      .then(r => setPosts(r.data?.results ?? r.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false))
    studentSpotlightService.getAll({ ordering: '-month' })
      .then(r => setSpotlights(r.data?.results ?? r.data ?? []))
      .catch(() => {})
  }, [])

  const handleToggleLike = async (postId) => {
    try {
      const r = await postService.toggleLike(postId)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: r.data.liked, like_count: r.data.like_count } : p))
    } catch {}
  }

  const recentSpotlights = spotlights.slice(0, 3)

  return (
    <div style={{ margin: '-28px -32px -40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg,#3d6e98 0%,#4E89BD 60%,#61AFEE 100%)', padding: '32px 32px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>{role}</p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0 }}>Welcome, {displayName}!</h1>
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr 260px', flex: 1, background: '#F1F5F9', borderTop: '1px solid #E2E8F0' }}>

        {/* LEFT — Spotlights panel */}
        <div style={{ background: 'white', borderRight: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Star size={15} strokeWidth={2} style={{ color: '#D97706' }} />
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>Spotlights</span>
            </div>
            <Link to="/community/spotlights" style={{ fontSize: '12px', color: '#4E89BD', fontWeight: 600, textDecoration: 'none' }}>+ New</Link>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {recentSpotlights.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <Star size={28} strokeWidth={1.4} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.4 }} />
                <p style={{ fontSize: '13px', marginBottom: '10px' }}>No spotlights yet</p>
                <Link to="/community/spotlights" style={{ fontSize: '13px', color: '#4E89BD', fontWeight: 600, textDecoration: 'none', background: '#EFF6FF', padding: '6px 14px', borderRadius: '20px' }}>
                  Submit first one
                </Link>
              </div>
            ) : recentSpotlights.map(s => (
              <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#D97706,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star size={12} fill="white" style={{ color: 'white' }} />
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{s.student_name}</p>
                </div>
                <p style={{ fontSize: '11px', color: '#94A3B8', paddingLeft: '36px' }}>
                  {s.fed_level} · {new Date(s.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Posts feed */}
        <div style={{ padding: '24px 20px', minWidth: 0 }}>
          {postsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '14px' }}>Loading feed…</div>
          ) : posts.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <Newspaper size={38} strokeWidth={1.2} style={{ color: '#CBD5E1', margin: '0 auto 14px', display: 'block' }} />
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#475569', marginBottom: '8px' }}>No posts yet</p>
            </div>
          ) : posts.map(post => (
            <PostCard key={post.id} post={post} onToggleLike={handleToggleLike} />
          ))}
        </div>

        {/* RIGHT — Quick access */}
        <div style={{ background: 'white', borderLeft: '1px solid #E2E8F0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>Quick Access</span>
          </div>
          {QUICK_LINKS.map(({ label, desc, Icon, color, bg, to, href, external }) => {
            const inner = (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} strokeWidth={2} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{label}</p>
                  <p style={{ fontSize: '12px', color: '#94A3B8' }}>{desc}</p>
                </div>
                {external && <ExternalLink size={12} style={{ color: '#CBD5E1', flexShrink: 0 }} />}
              </div>
            )
            const shared = { display: 'block', textDecoration: 'none', borderBottom: '1px solid #F8FAFC', transition: 'background 0.15s' }
            return external
              ? <a key={label} href={href} target="_blank" rel="noreferrer" style={shared} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{inner}</a>
              : <Link key={label} to={to} style={shared} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{inner}</Link>
          })}
        </div>

      </div>
    </div>
  )
}
