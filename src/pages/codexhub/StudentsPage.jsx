import React, { useEffect, useState, useRef } from 'react'
import {
  Bell, FileText, Video, CheckCircle2, XCircle, Star, CheckCheck,
  GraduationCap, Briefcase, User, FileText as FileTextIcon,
  ExternalLink, Heart, MessageCircle, Send,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import notificationService from '@/services/notificationService'
import postService from '@/services/postService'

const NOTIF_META = {
  application_update:  { label: 'Application Update', Icon: FileText,     bg: '#EFF6FF', color: '#4E89BD' },
  interview_scheduled: { label: 'Interview Scheduled', Icon: Video,        bg: '#FFFBEB', color: '#D97706' },
  offer_received:      { label: 'Offer Received',      Icon: CheckCircle2, bg: '#F0FDF4', color: '#16A34A' },
  hired:               { label: 'Hired',               Icon: Star,         bg: '#F0FDF4', color: '#16A34A' },
  rejected:            { label: 'Rejected',            Icon: XCircle,      bg: '#FFF1F2', color: '#E06C75' },
  general:             { label: 'General',             Icon: Bell,         bg: '#F8FAFC', color: '#64748B' },
}

const ACTIONS = [
  { label: 'My Courses',      desc: 'Lessons & assignments',  Icon: GraduationCap,  color: '#F97316', bg: '#FFF7ED', href: 'https://moodle.mycodexacademy.com/login/index.php?lang=en_us', external: true },
  { label: 'Career Center',  desc: 'Browse open roles',      Icon: Briefcase,      color: '#4E89BD', bg: '#EFF6FF', to: '/codexhub/jobs' },
  { label: 'My Profile',     desc: 'Resume & portfolio',     Icon: User,           color: '#8B5CF6', bg: '#F5F3FF', to: '/profile' },
  { label: 'Applications',   desc: 'Track your pipeline',    Icon: FileTextIcon,   color: '#64748B', bg: '#F8FAFC', to: '/job-applications' },
  { label: 'My Instructors', desc: 'Meet your teachers',     Icon: Star,           color: '#D97706', bg: '#FEF3C7', to: '/codexhub/instructors' },
]

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function PostCard({ post, currentUser, onToggleLike }) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)

  const authorInitials = (post.author_initials || post.author_name?.[0] || '?').toUpperCase()
  const liked = post.liked_by_me

  const toggleComments = async () => {
    if (!showComments && comments.length === 0) {
      setLoadingComments(true)
      try {
        const res = await postService.getComments(post.id)
        setComments(res.data?.results ?? res.data ?? [])
      } catch {}
      setLoadingComments(false)
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

  const POST_TYPE_BADGE = {
    student_spotlight: { label: 'Student Spotlight', color: '#D97706', bg: '#FEF3C7' },
    announcement:      { label: 'Announcement',      color: '#7C3AED', bg: '#EDE9FE' },
    general:           { label: 'General',           color: '#4E89BD', bg: '#EFF6FF' },
  }
  const badge = POST_TYPE_BADGE[post.post_type] || POST_TYPE_BADGE.general

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #4E89BD, #3d6e98)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 800, color: 'white',
        }}>{authorInitials}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{post.author_name || 'CodeX Academy'}</p>
          <p style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(post.created_at)}</p>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '20px' }}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 16px' }}>
        {post.title && <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>{post.title}</p>}
        <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
      </div>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt={post.title || 'Post image'} style={{
          width: '100%', maxHeight: '400px', objectFit: 'cover',
          borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9',
          display: 'block',
        }} />
      )}

      {/* Actions bar */}
      <div style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: post.image_url ? 'none' : '1px solid #F8FAFC' }}>
        <button onClick={() => onToggleLike(post.id)} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600,
          color: liked ? '#E06C75' : '#94A3B8',
          padding: '6px 0', transition: 'color 0.15s',
        }}>
          <Heart size={16} strokeWidth={2} fill={liked ? '#E06C75' : 'none'} />
          {post.like_count > 0 && post.like_count}
        </button>
        <button onClick={toggleComments} style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '13px', fontWeight: 600, color: '#94A3B8',
          padding: '6px 0', transition: 'color 0.15s',
        }}>
          <MessageCircle size={16} strokeWidth={2} />
          {post.comment_count > 0 && post.comment_count}
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '0 16px 12px' }}>
          {loadingComments ? (
            <p style={{ fontSize: '12px', color: '#94A3B8', padding: '10px 0' }}>Loading…</p>
          ) : comments.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, color: '#64748B',
              }}>{(c.author_initials || c.author_name?.[0] || '?').toUpperCase()}</div>
              <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '7px 10px', flex: 1 }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '2px' }}>{c.author_name}</p>
                <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5 }}>{c.content}</p>
              </div>
            </div>
          ))}
          <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <input
              ref={inputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Write a comment…"
              style={{
                flex: 1, border: '1px solid #E2E8F0', borderRadius: '20px',
                padding: '7px 14px', fontSize: '13px', outline: 'none',
                background: '#F8FAFC',
              }}
            />
            <button type="submit" disabled={submitting || !commentText.trim()} style={{
              background: '#4E89BD', color: 'white', border: 'none', borderRadius: '50%',
              width: '34px', height: '34px', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              opacity: (!commentText.trim() || submitting) ? 0.5 : 1,
            }}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function StudentsPage({ userName }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [posts, setPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(true)

  useEffect(() => {
    notificationService.getAll({ ordering: '-created_at' })
      .then(res => setNotifications(res.data?.results ?? res.data ?? []))
      .catch(() => {})
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

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    } catch {}
  }

  const displayName = userName || user?.first_name || user?.username || 'Student'
  const initials = (user?.first_name?.[0] ?? user?.username?.[0] ?? 'S').toUpperCase()
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    /* Break out of .main's padding: 28px top, 32px sides */
    <div style={{ margin: '-28px -32px -40px', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Banner ───────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #3d6e98 0%, #4E89BD 60%, #61AFEE 100%)',
        padding: '32px 32px 28px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
          background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 800, color: 'white',
          border: '2px solid rgba(255,255,255,0.4)',
        }}>
          {initials}
        </div>
        <div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>
            Student Dashboard
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'white', margin: 0 }}>
            Welcome back, {displayName}!
          </h1>
        </div>
        {unreadCount > 0 && (
          <div style={{
            marginLeft: 'auto', background: '#E06C75', color: 'white',
            borderRadius: '20px', padding: '5px 14px',
            fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px',
          }}>
            <Bell size={13} strokeWidth={2.5} />
            {unreadCount} new
          </div>
        )}
      </div>

      {/* ── 3-column body ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '280px 1fr 260px',
        flex: 1,
        background: '#F1F5F9',
        borderTop: '1px solid #E2E8F0',
      }}>

        {/* LEFT — Notifications */}
        <div style={{
          background: 'white',
          borderRight: '1px solid #E2E8F0',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, background: 'white', zIndex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <Bell size={15} strokeWidth={2} style={{ color: '#4E89BD' }} />
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>Notifications</span>
              {unreadCount > 0 && (
                <span style={{
                  background: '#4E89BD', color: 'white', borderRadius: '10px',
                  padding: '1px 7px', fontSize: '11px', fontWeight: 700,
                }}>{unreadCount}</span>
              )}
            </div>
            <Link to="/notifications" style={{ fontSize: '12px', color: '#4E89BD', fontWeight: 600, textDecoration: 'none' }}>
              See all
            </Link>
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: '#94A3B8' }}>
                <Bell size={28} strokeWidth={1.4} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                <p style={{ fontSize: '13px' }}>No notifications yet</p>
              </div>
            ) : notifications.slice(0, 12).map((notif) => {
              const meta = NOTIF_META[notif.notification_type] || NOTIF_META.general
              const { Icon } = meta
              return (
                <div key={notif.id} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '12px 16px',
                  background: notif.is_read ? 'transparent' : '#F0F7FF',
                  borderBottom: '1px solid #F8FAFC',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} strokeWidth={2} style={{ color: meta.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: notif.is_read ? 500 : 700, color: '#1E293B', lineHeight: 1.35, marginBottom: '3px' }}>
                      {notif.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4, marginBottom: '4px' }}>
                      {notif.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(notif.created_at)}</span>
                      {!notif.is_read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4E89BD', flexShrink: 0 }} />}
                    </div>
                  </div>
                  {!notif.is_read && (
                    <button onClick={() => handleMarkRead(notif.id)} title="Mark as read" style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '3px', color: '#16A34A', flexShrink: 0,
                      display: 'flex', alignItems: 'center',
                    }}>
                      <CheckCheck size={13} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* CENTER — Posts Feed */}
        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
          {postsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: '14px' }}>Loading feed…</div>
          ) : posts.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0',
              padding: '48px 24px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              <MessageCircle size={38} strokeWidth={1.2} style={{ color: '#CBD5E1', margin: '0 auto 14px', display: 'block' }} />
              <p style={{ fontWeight: 700, fontSize: '16px', color: '#475569', marginBottom: '8px' }}>No posts yet</p>
              <p style={{ fontSize: '14px', color: '#94A3B8', maxWidth: '300px', margin: '0 auto', lineHeight: 1.6 }}>
                Announcements and updates from CodeX Academy will appear here.
              </p>
            </div>
          ) : posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} onToggleLike={handleToggleLike} />
          ))}
        </div>

        {/* RIGHT — Quick Access */}
        <div style={{
          background: 'white',
          borderLeft: '1px solid #E2E8F0',
        }}>
          <div style={{
            padding: '14px 16px', borderBottom: '1px solid #F1F5F9',
            position: 'sticky', top: 0, background: 'white', zIndex: 1,
          }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>Quick Access</span>
          </div>
          <div>
            {ACTIONS.map(({ label, desc, Icon, color, bg, href, to, external }) => {
              const inner = (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', cursor: 'pointer',
                }}>
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                    background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={17} strokeWidth={2} style={{ color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{label}</p>
                    <p style={{ fontSize: '12px', color: '#94A3B8' }}>{desc}</p>
                  </div>
                  {external && <ExternalLink size={12} style={{ color: '#CBD5E1', flexShrink: 0 }} />}
                </div>
              )
              const sharedStyle = {
                display: 'block', textDecoration: 'none',
                borderBottom: '1px solid #F8FAFC',
                transition: 'background 0.15s',
              }
              return external ? (
                <a key={label} href={href} target="_blank" rel="noreferrer" style={sharedStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {inner}
                </a>
              ) : (
                <Link key={label} to={to} style={sharedStyle}
                  onMouseEnter={e => e.currentTarget.style.background = '#F8FAFC'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {inner}
                </Link>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
