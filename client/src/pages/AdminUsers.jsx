import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/PixelButton";
import api from "../api/axios";
import "./AdminList.css";
import { isAdminUser } from "../utils/auth";

export default function AdminUsers({ user }) {
  const navigate = useNavigate();
  const isAdmin = isAdminUser(user);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const adminHeaders = useMemo(() => (user ? { "x-user-id": user.id } : {}), [user]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/admin/users", { headers: adminHeaders });
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setStatus(error.response?.data || "사용자 목록 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [isAdmin, navigate, adminHeaders]);

  const runUserAction = async (id, action) => {
    try {
      setStatus(`요청 중: ${action} -> ${id}`);
      await api.patch(`/admin/users/${id}/${action}`, null, { headers: adminHeaders });
      setUsers((prev) =>
        prev.map((u) => (Number(u.user_id) === Number(id) ? { ...u, is_blocked: action === "block" ? 1 : 0 } : u))
      );
      setStatus(`✅ 완료: ${id} ${action}`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ 실패: ${error.response?.data || error.message}`);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <p className="eyebrow">ADMIN / USERS</p>
        <h2>사용자 관리</h2>
        <p className="lede">사용자 차단/해제와 상태를 한눈에 확인하세요.</p>
        <PixelButton text="← 대시보드" onClick={() => navigate("/admin")}/>
      </div>

      {loading && <div className="admin-status">로딩 중...</div>}
      {status && <div className="admin-status">{status}</div>}

      <div className="admin-list">
        <div className="admin-list-header users-header">
          <span>ID</span>
          <span>이름</span>
          <span>이메일</span>
          <span>권한</span>
          <span>차단</span>
          <span>액션</span>
        </div>
        {users.map((u) => (
          <div className="admin-list-row users-row" key={u.user_id}>
            <span>{u.user_id}</span>
            <span>{u.username}</span>
            <span className="ellipsis">{u.email}</span>
            <span>{u.is_admin ? "관리자" : "일반"}</span>
            <span>{u.is_blocked ? "차단됨" : "정상"}</span>
            <div className="row-actions compact">
              <PixelButton className="compact" text="노트" onClick={() => navigate(`/admin/notes?user=${u.user_id}`)} />
              <PixelButton className="compact" text="댓글" onClick={() => navigate(`/admin/comments?user=${u.user_id}`)} />
              <PixelButton className="compact" text="차단" onClick={() => runUserAction(u.user_id, "block")} />
              <PixelButton className="compact green" text="해제" onClick={() => runUserAction(u.user_id, "unblock")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
