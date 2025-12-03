import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import PixelButton from "../components/PixelButton";

export default function AdminDashboard({ user }) {
  const navigate = useNavigate();
  const isAdmin = Boolean(user && (Number(user.id) === 4 || user.is_admin === 1));

  if (!isAdmin) {
    // 프론트 단에서 가드 (서버에서도 한 번 더 검증 필요)
    navigate("/");
    return null;
  }

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <p className="eyebrow">ADMIN CONSOLE</p>
        <h2>🎄 niki kan 관리자님, 트리를 정리해볼까요?</h2>
        <p className="lede">
          노트/댓글 숨김, 삭제·복구, 사용자 차단까지 한 곳에서 관리하세요. (기능 연동은 추후 백엔드와 연결 예정)
        </p>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <div className="card-header">
            <h3>노트 관리</h3>
            <span className="tag warn">콘텐츠</span>
          </div>
          <p className="card-copy">노트를 숨기거나 다시 보이게 하고, 필요하면 삭제/복구까지 처리합니다.</p>
          <div className="card-actions">
            <PixelButton text="숨김 / 표시" onClick={() => alert("백엔드 연동 후 동작 예정")} />
            <PixelButton text="삭제 / 복구" onClick={() => alert("백엔드 연동 후 동작 예정")} />
          </div>
        </section>

        <section className="admin-card">
          <div className="card-header">
            <h3>댓글 관리</h3>
            <span className="tag info">토론</span>
          </div>
          <p className="card-copy">댓글을 숨기거나 복원하고, 스팸성 댓글을 빠르게 정리하세요.</p>
          <div className="card-actions">
            <PixelButton text="숨김 / 표시" onClick={() => alert("백엔드 연동 후 동작 예정")} />
            <PixelButton text="삭제 / 복구" onClick={() => alert("백엔드 연동 후 동작 예정")} />
          </div>
        </section>

        <section className="admin-card">
          <div className="card-header">
            <h3>사용자 제재</h3>
            <span className="tag danger">안전</span>
          </div>
          <p className="card-copy">문제 행동이 있는 사용자를 차단/해제하고, 트리 접근을 제어합니다.</p>
          <div className="card-actions">
            <PixelButton text="차단 / 해제" onClick={() => alert("백엔드 연동 후 동작 예정")} />
          </div>
        </section>

        <section className="admin-card">
          <div className="card-header">
            <h3>로그 확인</h3>
            <span className="tag neutral">기록</span>
          </div>
          <p className="card-copy">admin_log를 조회해 누가 언제 어떤 조치를 했는지 확인합니다.</p>
          <div className="card-actions">
            <PixelButton text="로그 보기" onClick={() => alert("백엔드 연동 후 동작 예정")} />
          </div>
        </section>
      </div>
    </div>
  );
}
