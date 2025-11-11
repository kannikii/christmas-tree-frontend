import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../components/PixelForm.css'
import api from '../api/axios'

function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleRegister = async (e) => {
    e.preventDefault()

    try {
      await api.post('/register', { username, email, password })
      setMessage('✅ 회원가입 성공! 로그인 페이지로 이동합니다.')
      setTimeout(() => navigate('/login'), 1000)
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data || '서버 오류 발생'
      setMessage(`❌ ${serverMessage}`)
      console.error(error)
    }
  }

  return (
    <div className="pixel-form-container">
      <div className="pixel-form-box">
        <h2 className="pixel-form-title">회원가입</h2>
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="사용자 이름"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pixel-input"
          />
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pixel-input"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pixel-input"
          />
          <button type="submit" className="pixel-button">
            회원가입
          </button>
        </form>
        {message && <p className="pixel-link">{message}</p>}
        <p className="pixel-link action" onClick={() => navigate('/login')}>
          이미 계정이 있다면? 로그인
        </p>
      </div>
    </div>
  )
}

export default RegisterPage
