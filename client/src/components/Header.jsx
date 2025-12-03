import React from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "./PixelButton";
import "./Header.css";

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();
  const isAdmin = Boolean(user && (Number(user.id) === 4 || user.is_admin === 1));

  return (
    <header>
      <h1 onClick={() => navigate("/")}>🎄 ChristmasTree Note </h1>
      <nav>
        {user ? (
          <>
            {isAdmin && (
              <span className="admin-link" onClick={() => navigate("/admin")}>
                관리자 페이지
              </span>
            )}
            <span className="welcome">{user.username}님 환영합니다!</span>
            <PixelButton text="내 트리" onClick={() => navigate("/mytrees")} />
            <PixelButton text="로그아웃" onClick={onLogout} />
          </>
        ) : (
          <>
            <PixelButton text="로그인" onClick={() => navigate("/login")} />
            <PixelButton text="회원가입" onClick={() => navigate("/register")} />
          </>
        )}
      </nav>
    </header>
  );
}
