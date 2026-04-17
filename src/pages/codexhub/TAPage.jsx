import { useEffect, useState, useRef } from 'react'
import {
  Clock, BookCheck, Users, CircleUser, GraduationCap,
  ExternalLink, Heart, MessageCircle, Send, BarChart2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import postService from '@/services/postService'

/* ── helpers ─────────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const POST_TYPE_BADGE = {
  student_spotlight: { label: 'Student Spotlight', color: '#D97706', bg: '#FEF3C7' },
  announcement:      { label: 'Announcement',      color: '#7C3AED', bg: '#EDE9FE' },
  general:           { label: 'General',           color: '#4E89BD', bg: '#EFF6FF' },
}

/* ── Post Card ───────────────────────────────────────────────── */
function PostCard({ post, currentUser, onToggleLike }) {
  const [showComments, setShowComments] = useState(false)
  const [comments,     setComments]     = useState([])
  const [loadingCmts,  setLoadingCmts]  = useState(false)
  const [commentText,  setCommentText]  = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const inputRef = useRef(null)

  const badge         = POST_TYPE_BADGE[post.post_type] || POST_TYPE_BADGE.general
  const authorInitials = (post.author_initials || post.author_name?.[0] || '?').toUpperCase()
  const liked         = post.liked_by_me

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingCmts(true)
      try {
        const res = await postService.getComments(post.id)
        setComments(res.data?.results ?? res.data ?? [])
      } catch {}
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
      const res = await postService.addComment(post.id, { content: commentText.trim() })
      setComments(prev => [...prev, res.data])
      setCommentText('')
    } catch {}
    setSubmitting(false)
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#4E89BD,#3d6e98)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: 'white' }}>
          {authorInitials}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{post.author_name || 'CodeX Academy'}</p>
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(post.created_at)}</p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '20px' }}>
          {badge.label}
        </span>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {post.title && <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>{post.title}</p>}
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
      </div>

      {post.image_url && (
        <img src={post.image_url} alt={post.title || 'Post'} style={{ width: '100%', maxHeight: '360px', objectFit: 'cover', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', display: 'block' }} />
      )}

      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: post.image_url ? 'none' : '1px solid #F8FAFC' }}>
        <button onClick={() => onToggleLike(post.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: liked ? '#E06C75' : '#94A3B8', padding: '6px 0' }}>
          <Heart size={16} strokeWidth={2} fill={liked ? '#E06C75' : 'none'} />
          {post.like_count > 0 && post.like_count}
        </button>
        <button onClick={toggleComments} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#94A3B8', padding: '6px 0' }}>
          <MessageCircle size={16} strokeWidth={2} />
          {post.comment_count > 0 && post.comment_count}
        </button>
      </div>

      {showComments && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '0 16px 12px' }}>
          {loadingCmts ? (
            <p style={{ fontSize: '12px', color: '#94A3B8', padding: '10px 0' }}>Loading…</p>
          ) : comments.map(c => (
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
            <input ref={inputRef} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…"
              style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: '20px', padding: '7px 14px', fontSize: '13px', outline: 'none', background: '#F8FAFC' }} />
            <button type="submit" disabled={submitting || !commentText.trim()} style={{ background: '#4E89BD', color: 'white', border: 'none', borderRadius: '50%', width: '34px', height: '34px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: (!commentText.trim() || submitting) ? 0.5 : 1 }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

/* ── Quick Access items ──────────────────────────────────────── */
const QUICK_ITEMS = [
  { label: 'Log Class Hours',  desc: 'Record class session',   Icon: Clock,       color: '#1D4ED8', bg: '#DBEAFE', to: '/ta/logs' },
  { label: 'Log Task Review',  desc: 'Record task review',     Icon: BookCheck,   color: '#065F46', bg: '#D1FAE5', to: '/ta/logs' },
  { label: 'New Mentorship',   desc: 'Log a mentorship',       Icon: Users,       color: '#7C3AED', bg: '#EDE9FE', to: '/ta/logs' },
  { label: 'My Reports',       desc: 'Hours & mentorship log', Icon: BarChart2,   color: '#DB2777', bg: '#FCE7F3', to: '/ta/logs' },
  { label: 'My Profile',       desc: 'Your employee card',     Icon: CircleUser,  color: '#7C3AED', bg: '#F5F3FF', to: '/profile' },
  { label: 'My Courses',       desc: 'Teaching platform',      Icon: GraduationCap, color: '#F97316', bg: '#FFF7ED', href: 'https://moodle.mycodexacademy.com/login/index.php?lang=en_us', external: true },
]

/* ── Main ────────────────────────────────────────────────────── */
export default function TAPage() {
  const { user } = useAuth()
  const initials    = ((user?.first_name?.[0] ?? '') + (user?.last_name?.[0] ?? '')).toUpperCase() || 'TA'
  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username

  const [posts,       setPosts]       = useState([])
  const [postsLoading,setPostsLoading] = useState(true)

  useEffect(() => {
    postService.getAll({ ordering: '-created_at' })
      .then(res => setPosts(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false))
  }, [])

  const handleToggleLike = async (postId) => {
    try {
      const res = await postService.toggleLike(postId)
      setPosts(prev => prev.map(p => p.id === postId
        ? { ...p, liked_by_me: res.data.liked, like_count: res.data.like_count }
        : p
      ))
    } catch {}
  }

  return (
    <div style={{ margin: '-28px -32px -40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>

      {/* Banner */}
      <div style={{ background: 'linear-gradient(135deg,#3d6e98 0%,#4E89BD 60%,#61AFEE 100%)', padding: '32px 32px 28px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0, background: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 800, color: 'white', border: '2px solid rgba(255,255,255,0.4)' }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>Teaching Assistant</p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0 }}>Welcome, {displayName}!</h1>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', flex: 1, background: '#F1F5F9', borderTop: '1px solid #E2E8F0' }}>

        {/* FEED */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>Community Feed</p>
          {postsLoading ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>Loading posts…</p>
          ) : posts.length === 0 ? (
            <p style={{ color: '#94A3B8', fontSize: '14px' }}>No posts yet.</p>
          ) : posts.map(p => (
            <PostCard key={p.id} post={p} currentUser={user} onToggleLike={handleToggleLike} />
          ))}
        </div>

        {/* QUICK ACCESS */}
        <div style={{ background: 'white', borderLeft: '1px solid #E2E8F0' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F1F5F9', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>Quick Access</span>
          </div>
          {QUICK_ITEMS.map(({ label, desc, Icon, color, bg, to, href, external }) => {
            const inner = (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={17} strokeWidth={2} style={{ color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>{desc}</p>
                </div>
                {external && <ExternalLink size={12} style={{ color: '#CBD5E1', flexShrink: 0 }} />}
              </div>
            )
            const baseStyle = { display: 'block', textDecoration: 'none', borderBottom: '1px solid #F8FAFC' }
            if (external)
              return <a key={label} href={href} target="_blank" rel="noreferrer" style={baseStyle} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{inner}</a>
            return <Link key={label} to={to} style={baseStyle} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{inner}</Link>
          })}
        </div>
      </div>
    </div>
  )
}
