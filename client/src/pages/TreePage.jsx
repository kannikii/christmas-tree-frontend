import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Countdown from '../components/Countdown'
import treePageBg from '../assets/treePage-bg.gif'
import treeImage from '../assets/tree.png'
import noteImage from '../assets/note.png'
import './TreePage.css'
import api from '../api/axios'

const BASE_TREE_WIDTH = 660
const BASE_TREE_HEIGHT = 860
const COORD_OFFSET = 1_000_000
const COORD_SCALE = 10_000

const clamp01 = (value) => Math.min(Math.max(value, 0), 1)

const encodeCoordinate = (pixelValue, dimension) => {
  if (!dimension || dimension <= 0) return 0
  const ratio = clamp01(pixelValue / dimension)
  return Math.round(ratio * COORD_SCALE) + COORD_OFFSET
}

const decodeCoordinate = (storedValue, dimension, axis) => {
  if (storedValue == null || !dimension || dimension <= 0) return 0

  let ratio
  if (storedValue >= COORD_OFFSET) {
    ratio = (storedValue - COORD_OFFSET) / COORD_SCALE
  } else {
    const base = axis === 'x' ? BASE_TREE_WIDTH : BASE_TREE_HEIGHT
    ratio = base > 0 ? storedValue / base : 0
  }
  return clamp01(ratio) * dimension
}

function TreePage({ user }) {
  const [notes, setNotes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [clickPos, setClickPos] = useState({ x: 0, y: 0, encodedX: 0, encodedY: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeNote, setActiveNote] = useState(null)
  const [isEditingNote, setIsEditingNote] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)
  const [isDeletingNote, setIsDeletingNote] = useState(false)
  const [noteLikes, setNoteLikes] = useState({})
  const [noteComments, setNoteComments] = useState({})
  const [newComment, setNewComment] = useState('')
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false)
  const [likedNotes, setLikedNotes] = useState({})
  const [hasAccess, setHasAccess] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [treeSize, setTreeSize] = useState({ width: 0, height: 0 })
  const treeRef = useRef(null)
  const { id } = useParams()
  const treeId = id
  const navigate = useNavigate()

  useEffect(() => {
    if (!treeId) return
    if (!user) {
      setHasAccess(false)
      setIsCheckingAccess(false)
      alert('로그인이 필요합니다!')
      navigate('/login')
      return
    }

    setIsCheckingAccess(true)

    api
      .get(`/users/${user.id}/trees`)
      .then(({ data: list }) => {
        const allowed = Array.isArray(list)
          ? list.some((tree) => String(tree.tree_id) === String(treeId))
          : false

        if (!allowed) {
          alert('참여 중인 트리만 조회할 수 있습니다.')
          navigate('/', { replace: true })
        }
        setHasAccess(allowed)
      })
      .catch((err) => {
        console.error(err)
        alert('트리 접근 권한을 확인할 수 없습니다.')
        setHasAccess(false)
        navigate('/', { replace: true })
      })
      .finally(() => setIsCheckingAccess(false))
  }, [user, treeId, navigate])

  const loadComments = useCallback(async (noteId) => {
    if (!noteId) return
    try {
      const { data } = await api.get(`/notes/${noteId}/comments`)
      const comments = Array.isArray(data) ? data : []
      setNoteComments((prev) => ({ ...prev, [noteId]: comments }))
    } catch (error) {
      console.error(`노트 ${noteId} 댓글 조회 실패:`, error)
    }
  }, [])

  useEffect(() => {
    if (!treeId || !hasAccess) return

    const fetchNotes = async () => {
      try {
        const { data } = await api.get(`/trees/${treeId}/notes`)

        if (!Array.isArray(data)) return
        setNotes(data)
        setLikedNotes({})

        const noteIds = data
          .map((note) => note?.note_id)
          .filter((noteId) => typeof noteId === 'number' || typeof noteId === 'string')

        if (noteIds.length === 0) {
          setNoteLikes({})
          return
        }

        const likeEntries = await Promise.all(
          noteIds.map(async (noteId) => {
            try {
              const { data: countData } = await api.get(`/notes/${noteId}/likes/count`)
              return [noteId, countData.likeCount ?? 0]
            } catch (error) {
              console.error(`노트 ${noteId} 좋아요 수 조회 실패:`, error)
              return [noteId, 0]
            }
          })
        )

        setNoteLikes(Object.fromEntries(likeEntries))
      } catch (err) {
        console.error(err)
      }
    }

    fetchNotes()
  }, [treeId, hasAccess])

  useEffect(() => {
    if (!hasAccess) return

    const handleResize = () => {
      if (!treeRef.current) return
      const rect = treeRef.current.getBoundingClientRect()
      setTreeSize({ width: rect.width, height: rect.height })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [hasAccess])

  const getRenderedPosition = useCallback(
    (note) => {
      const rawX = note.pos_x ?? note.x ?? 0
      const rawY = note.pos_y ?? note.y ?? 0
      return {
        x: decodeCoordinate(rawX, treeSize.width, 'x'),
        y: decodeCoordinate(rawY, treeSize.height, 'y'),
      }
    },
    [treeSize.width, treeSize.height]
  )

  const handleTreeClick = (e) => {
    if (!user) {
      alert('로그인이 필요합니다!')
      window.location.href = '/login'
      return
    }

    if (!treeRef.current) return
    const rect = treeRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const treeCenterX = rect.width / 2
    const height = rect.height
    const baseWidth = rect.width
    const leftEdge = treeCenterX - (baseWidth / height) * y
    const rightEdge = treeCenterX + (baseWidth / height) * y

    if (x < leftEdge || x > rightEdge) return

    const encodedX = encodeCoordinate(x, rect.width)
    const encodedY = encodeCoordinate(y, rect.height)

    setClickPos({ x, y, encodedX, encodedY })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    if (!newNote.trim() || !user || !treeId) return

    try {
      setIsSubmitting(true)
      const { data } = await api.post(`/trees/${treeId}/notes`, {
        user_id: user.id,
        message: newNote,
        pos_x: clickPos.encodedX,
        pos_y: clickPos.encodedY,
      })
      const created = {
        note_id: data.note_id,
        message: newNote,
        pos_x: clickPos.encodedX,
        pos_y: clickPos.encodedY,
        author: user.username,
        user_id: user.id,
      }
      setNotes((prev) => [...prev, created])
      setNoteLikes((prev) => ({ ...prev, [created.note_id]: 0 }))
      setLikedNotes((prev) => ({ ...prev, [created.note_id]: false }))
      setNoteComments((prev) => ({ ...prev, [created.note_id]: [] }))
      setShowModal(false)
      setNewNote('')
      setClickPos({ x: 0, y: 0, encodedX: 0, encodedY: 0 })
    } catch (error) {
      console.error(error)
      alert('노트 저장 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleLike = async (noteId) => {
    if (!noteId) return
    if (!user) {
      alert('로그인이 필요합니다!')
      navigate('/login')
      return
    }

    const alreadyLiked = likedNotes[noteId] === true

    try {
      const { data } = alreadyLiked
        ? await api.delete(`/notes/${noteId}/likes`, { data: { user_id: user.id } })
        : await api.post(`/notes/${noteId}/likes`, { user_id: user.id })

      const latestCount =
        typeof data.likeCount === 'number'
          ? data.likeCount
          : noteLikes[noteId] || 0

      setNoteLikes((prev) => ({ ...prev, [noteId]: latestCount }))
      setLikedNotes((prev) => ({ ...prev, [noteId]: !alreadyLiked }))
    } catch (error) {
      console.error(error)
      alert('좋아요 처리 중 문제가 발생했습니다.')
    }
  }

  const handleSubmitComment = async () => {
    if (!user) {
      alert('로그인이 필요합니다!')
      navigate('/login')
      return
    }
    if (!activeNote?.note_id) return
    const noteId = activeNote.note_id
    const content = newComment.trim()
    if (!content) return

    try {
      setIsCommentSubmitting(true)
      await api.post(`/notes/${noteId}/comments`, {
        user_id: user.id,
        content,
      })
      setNewComment('')
      await loadComments(noteId)
    } catch (error) {
      console.error(error)
      alert('댓글 등록 중 문제가 발생했습니다.')
    } finally {
      setIsCommentSubmitting(false)
    }
  }

  const handleStartEditNote = () => {
    if (!activeNote) return
    setIsEditingNote(true)
    setEditMessage(activeNote.message || '')
  }

  const handleCancelEditNote = () => {
    setIsEditingNote(false)
    setEditMessage(activeNote?.message || '')
  }

  const handleSaveNoteEdit = async () => {
    if (!activeNote?.note_id || !user) return
    const trimmed = editMessage.trim()
    if (!trimmed) {
      alert('메모 내용을 입력하세요.')
      return
    }
    if (isUpdatingNote) return
    try {
      setIsUpdatingNote(true)
      await api.put(`/trees/${treeId}/notes/${activeNote.note_id}`, {
        user_id: user.id,
        message: trimmed,
      })
      setNotes((prev) =>
        prev.map((note) =>
          note.note_id === activeNote.note_id ? { ...note, message: trimmed } : note
        )
      )
      setActiveNote((prev) => (prev ? { ...prev, message: trimmed } : prev))
      setIsEditingNote(false)
    } catch (error) {
      console.error(error)
      alert('메모 수정 중 문제가 발생했습니다.')
    } finally {
      setIsUpdatingNote(false)
    }
  }

  const handleDeleteNote = async () => {
    if (!activeNote?.note_id || !user) return
    if (isDeletingNote) return
    const confirmed = window.confirm('이 메모를 삭제하시겠습니까?')
    if (!confirmed) return
    try {
      setIsDeletingNote(true)
      await api.delete(`/trees/${treeId}/notes/${activeNote.note_id}`, {
        data: { user_id: user.id },
      })
      setNotes((prev) => prev.filter((note) => note.note_id !== activeNote.note_id))
      setActiveNote(null)
      setIsEditingNote(false)
      setEditMessage('')
    } catch (error) {
      console.error(error)
      alert('메모 삭제 중 문제가 발생했습니다.')
    } finally {
      setIsDeletingNote(false)
    }
  }

  const activeNoteId = activeNote?.note_id
  const currentComments = activeNoteId ? noteComments[activeNoteId] : null
  useEffect(() => {
    if (!activeNoteId) return
    loadComments(activeNoteId)
  }, [activeNoteId, loadComments])
  const isNoteOwner =
    Boolean(user && activeNote && Number(user.id) === Number(activeNote.user_id))

  if (isCheckingAccess) {
    return (
      <div
        className="tree-page-bg"
        style={{
          backgroundImage: `url(${treePageBg})`,
        }}
      >
        <Countdown />
        <p className="tree-instruction">트리 접근 권한을 확인 중입니다...</p>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <div
      className="tree-page-bg"
      style={{
        backgroundImage: `url(${treePageBg})`,
      }}
    >
      <Countdown />
      <p className="tree-instruction">트리를 클릭하여 장식을 달아주세요</p>

      <div className="tree-page-wrapper">
        <div
          ref={treeRef}
          className="tree-canvas"
          style={{
            backgroundImage: `url(${treeImage})`,
          }}
          onClick={handleTreeClick}
        >
          {treeSize.width > 0 &&
            notes.map((note) => {
              const { x, y } = getRenderedPosition(note)
              return (
                <div
                  key={note.note_id || `${note.pos_x}-${note.pos_y}`}
                  className="tree-note-wrapper"
                  style={{
                    position: 'absolute',
                    top: y - 28,
                    left: x - 24,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveNote(note)
                    setNewComment('')
                    setIsEditingNote(false)
                    setEditMessage(note.message || '')
                  }}
                >
                  <img
                    src={noteImage}
                    alt="tree note"
                    className="tree-note"
                    style={{
                      width: '64px',
                      height: '64px',
                    }}
                  />
                  <span className="tree-note-like-count">
                    ❤️ {noteLikes[note.note_id] ?? 0}
                  </span>
                </div>
              )
            })}
        </div>
      </div>

      {showModal && (
        <div className="note-modal-overlay">
          <div className="note-modal">
            <h3>메모 작성</h3>
            <textarea
              className="note-textarea"
              rows={4}
              maxLength={120}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="트리에 남길 메시지를 입력하세요."
            />
            <div className="note-modal-actions">
              <button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? '저장 중...' : '작성'}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {activeNote && (
        <div className="note-detail-overlay">
          <div className="note-detail-panel">
            <button
              className="note-detail-close"
              onClick={() => {
                setActiveNote(null)
                setIsEditingNote(false)
                setEditMessage('')
              }}
            >
              ✖
            </button>
            <div className="note-detail-header">
              <h3>장식 메모</h3>
              <span className="note-detail-author">{activeNote.author || '익명'}</span>
            </div>
            {isEditingNote ? (
              <textarea
                className="note-detail-editor"
                rows={4}
                maxLength={120}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
              />
            ) : (
              <p className="note-detail-message">{activeNote.message}</p>
            )}

            <div className="note-detail-actions">
              <button
                className={`pixel-button note-like-toggle ${
                  likedNotes[activeNote.note_id] ? 'liked' : ''
                }`}
                onClick={() => handleToggleLike(activeNote.note_id)}
              >
                {likedNotes[activeNote.note_id] ? '💔 좋아요 취소' : '❤️ 좋아요'} (
                {noteLikes[activeNote.note_id] ?? 0})
              </button>
            </div>
            {isNoteOwner && (
              <div className="note-owner-actions">
                {isEditingNote ? (
                  <>
                    <button
                      className="pixel-button secondary"
                      type="button"
                      onClick={handleCancelEditNote}
                      disabled={isUpdatingNote}
                    >
                      취소
                    </button>
                    <button
                      className="pixel-button primary"
                      type="button"
                      onClick={handleSaveNoteEdit}
                      disabled={isUpdatingNote}
                    >
                      {isUpdatingNote ? '수정 중...' : '수정 완료'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="pixel-button secondary"
                      type="button"
                      onClick={handleStartEditNote}
                    >
                      ✏️ 수정
                    </button>
                    <button
                      className="pixel-button danger"
                      type="button"
                      onClick={handleDeleteNote}
                      disabled={isDeletingNote}
                    >
                      {isDeletingNote ? '삭제 중...' : '🗑 삭제'}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="note-comment-section">
              <h4>댓글</h4>
              <div className="note-comment-list">
                {!Array.isArray(currentComments) && (
                  <p className="note-comment-empty">댓글을 불러오는 중입니다...</p>
                )}
                {Array.isArray(currentComments) && currentComments.length === 0 && (
                  <p className="note-comment-empty">첫 댓글을 남겨보세요!</p>
                )}
                {Array.isArray(currentComments) &&
                  currentComments.map((comment) => (
                    <div
                      key={comment.comment_id || `${comment.author}-${comment.content}`}
                      className="note-comment-item"
                    >
                      <span className="note-comment-author">{comment.author || '익명'}</span>
                      <p>{comment.content}</p>
                    </div>
                  ))}
              </div>
              <div className="note-comment-form">
                <input
                  type="text"
                  placeholder="댓글을 입력하세요"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  className="pixel-button"
                  type="button"
                  onClick={handleSubmitComment}
                  disabled={isCommentSubmitting}
                >
                  {isCommentSubmitting ? '등록 중...' : '댓글 등록'}
                </button>
              </div>
              <p className="note-comment-info">※ 댓글은 즉시 서버에 저장됩니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TreePage
