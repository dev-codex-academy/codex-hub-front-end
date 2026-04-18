import React, { useEffect, useState, useRef } from 'react'
import { Plus, Upload, X, Heart, MessageCircle, Trash2, Image as ImageIcon } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

import postService from '@/services/postService'
import studentSpotlightService from '@/services/studentSpotlightService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import Swal from 'sweetalert2'

const POST_TYPE_LABELS = {
  general: 'General',
  student_spotlight: 'Student Spotlight',
  announcement: 'Announcement',
}

const POST_TYPE_BADGE = {
  student_spotlight: { color: '#D97706', bg: '#FEF3C7' },
  announcement:      { color: '#7C3AED', bg: '#EDE9FE' },
  general:           { color: '#4E89BD', bg: '#EFF6FF' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60)     return 'just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function CreatePostModal({ onClose, onCreated, spotlights }) {
  const [form, setForm] = useState({ title: '', content: '', post_type: 'general', spotlight: '' })
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef(null)

  const handleImage = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.content.trim()) return
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        post_type: form.post_type,
      }
      if (form.post_type === 'student_spotlight' && form.spotlight) {
        payload.spotlight = form.spotlight
      }
      const res = await postService.create(payload)
      const newPost = res.data

      if (imageFile) {
        const fd = new FormData()
        fd.append('image', imageFile)
        const imgRes = await postService.uploadImage(newPost.id, fd)
        newPost.image_url = imgRes.data.image_url
      }
      onCreated(newPost)
      onClose()
    } catch {
      Swal.fire('Error', 'Could not create post.', 'error')
    }
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1E293B', margin: 0 }}>New Post</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Type</label>
            <Select value={form.post_type} onValueChange={v => setForm(f => ({ ...f, post_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(POST_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.post_type === 'student_spotlight' && spotlights.length > 0 && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Link Spotlight (optional)</label>
              <Select value={form.spotlight} onValueChange={v => setForm(f => ({ ...f, spotlight: v }))}>
                <SelectTrigger><SelectValue placeholder="Select spotlight…" /></SelectTrigger>
                <SelectContent>
                  {spotlights.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.student_name} — {new Date(s.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Title (optional)</label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title…" />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Content *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Write something…"
              rows={5}
              required
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '8px 12px', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Image (optional)</label>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', border: '1px solid #E2E8F0', objectFit: 'cover' }} />
                <button type="button" onClick={() => { setImageFile(null); setPreview(null) }} style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%',
                  width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={12} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                border: '2px dashed #CBD5E1', borderRadius: '8px', padding: '12px 16px',
                background: 'transparent', color: '#94A3B8', cursor: 'pointer', fontSize: '13px',
              }}>
                <ImageIcon size={16} /> Click to upload an image
              </button>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.content.trim()}>
              {saving ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CommunityPage() {
  const { user } = useAuth()
  const perms     = new Set(user?.permissions ?? [])
  const canManage = user?.is_staff || perms.has('app.change_jobapplication')
  const [posts, setPosts] = useState([])
  const [spotlights, setSpotlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    postService.getAll({ ordering: '-created_at' })
      .then(res => setPosts(res.data?.results ?? res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
    studentSpotlightService.getAll({ ordering: '-month' })
      .then(res => setSpotlights(res.data?.results ?? res.data ?? []))
      .catch(() => {})
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

  const handleDelete = async (postId) => {
    const r = await Swal.fire({
      title: 'Delete post?',
      text: 'This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#E06C75',
      confirmButtonText: 'Delete',
    })
    if (!r.isConfirmed) return
    try {
      await postService.remove(postId)
      setPosts(prev => prev.filter(p => p.id !== postId))
    } catch {
      Swal.fire('Error', 'Could not delete post.', 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1E293B', margin: 0 }}>Community Feed</h1>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>Manage posts visible to all students</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> New Post
          </Button>
        )}
      </div>

      {loading ? (
        <p style={{ color: '#94A3B8', fontSize: '14px' }}>Loading…</p>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '16px', color: '#475569', marginBottom: '8px' }}>No posts yet</p>
            <p style={{ fontSize: '14px', color: '#94A3B8' }}>Create the first post for your students.</p>
          </CardContent>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '680px' }}>
          {posts.map(post => {
            const badge = POST_TYPE_BADGE[post.post_type] || POST_TYPE_BADGE.general
            const authorInitials = (post.author_initials || post.author_name?.[0] || '?').toUpperCase()
            return (
              <Card key={post.id} style={{ overflow: 'hidden' }}>
                <CardContent style={{ padding: 0 }}>
                  <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #4E89BD, #3d6e98)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 800, color: 'white',
                    }}>{authorInitials}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', marginBottom: '1px' }}>{post.author_name || 'CodeX Academy'}</p>
                      <p style={{ fontSize: '11px', color: '#94A3B8' }}>{timeAgo(post.created_at)}</p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: badge.color, background: badge.bg, padding: '2px 8px', borderRadius: '20px' }}>
                      {POST_TYPE_LABELS[post.post_type] || 'General'}
                    </span>
                    {canManage && (
                      <button onClick={() => handleDelete(post.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px', display: 'flex', alignItems: 'center' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  {(post.title || post.content) && (
                    <div style={{ padding: '0 16px 14px' }}>
                      {post.title && <p style={{ fontSize: '15px', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>{post.title}</p>}
                      <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>
                    </div>
                  )}

                  {post.image_url && (
                    <img src={post.image_url} alt={post.title || 'Post'} style={{
                      width: '100%', maxHeight: '400px', objectFit: 'cover',
                      borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9', display: 'block',
                    }} />
                  )}

                  <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '16px', borderTop: post.image_url ? 'none' : '1px solid #F8FAFC' }}>
                    <button onClick={() => handleToggleLike(post.id)} style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 600,
                      color: post.liked_by_me ? '#E06C75' : '#94A3B8',
                    }}>
                      <Heart size={15} fill={post.liked_by_me ? '#E06C75' : 'none'} />
                      {post.like_count > 0 && post.like_count}
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: '#94A3B8', fontWeight: 600 }}>
                      <MessageCircle size={15} />
                      {post.comment_count > 0 && post.comment_count}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={post => setPosts(prev => [post, ...prev])}
          spotlights={spotlights}
        />
      )}
    </div>
  )
}
