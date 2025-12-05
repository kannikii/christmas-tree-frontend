import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PixelButton from "../components/PixelButton";
import api from "../api/axios";
import "./AdminList.css";

export default function AdminNotes({ user }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedUser = params.get("user");
  const isAdmin = Boolean(user && Number(user.is_admin) === 1);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(preselectedUser || "");
  const [notes, setNotes] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const adminHeaders = useMemo(() => (user ? { "x-user-id": user.id } : {}), [user]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    const fetchUsers = async () => {
      try {
        const { data } = await api.get("/admin/users", { headers: adminHeaders });
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setStatus(error.response?.data || "사용자 목록 조회 실패");
      }
    };
    fetchUsers();
  }, [isAdmin, navigate, adminHeaders]);

  useEffect(() => {
    if (!selectedUser) {
      setNotes([]);
      return;
    }
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/users/${selectedUser}/notes`, { headers: adminHeaders });
        setNotes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setStatus(error.response?.data || "노트 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [selectedUser, adminHeaders]);

  const runNoteAction = async (noteId, action) => {
    try {
      setStatus(`요청 중: ${noteId} ${action}`);
      if (action === "delete") {
        await api.delete(`/admin/notes/${noteId}`, { headers: adminHeaders });
      } else {
        await api.patch(`/admin/notes/${noteId}/${action}`, null, { headers: adminHeaders });
      }
      setNotes((prev) =>
        prev.map((n) =>
          Number(n.note_id) === Number(noteId)
            ? { ...n, is_hidden: action === "hide" ? 1 : action === "show" ? 0 : n.is_hidden }
            : n
        ).filter((n) => (action === "delete" ? Number(n.note_id) !== Number(noteId) : true))
      );
      setStatus(`✅ 완료: ${noteId} ${action}`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ 실패: ${error.response?.data || error.message}`);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <p className="eyebrow">ADMIN / NOTES</p>
        <h2>노트 관리</h2>
        <p className="lede">사용자를 선택하고 해당 사용자의 노트를 관리하세요.</p>
        <PixelButton text="← 대시보드" onClick={() => navigate("/admin")}/>
      </div>

      <div className="admin-filter">
        <label>사용자 선택:</label>
        <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
          <option value="">-- 사용자 선택 --</option>
          {users.map((u) => (
            <option key={u.user_id} value={u.user_id}>
              {u.user_id} - {u.username}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="admin-status">로딩 중...</div>}
      {status && <div className="admin-status">{status}</div>}

      <div className="admin-list">
        <div className="admin-list-header">
          <span>ID</span>
          <span>트리</span>
          <span>내용</span>
          <span>상태</span>
          <span>액션</span>
        </div>
        {notes.map((n) => (
          <div className="admin-list-row" key={n.note_id}>
            <span>{n.note_id}</span>
            <span>{n.tree_name || n.tree_id}</span>
            <span className="ellipsis">{n.message}</span>
            <span>{n.is_hidden ? "숨김" : "표시"}</span>
            <div className="row-actions">
              {n.is_hidden ? (
                <PixelButton text="표시" onClick={() => runNoteAction(n.note_id, "show")} />
              ) : (
                <PixelButton text="숨김" onClick={() => runNoteAction(n.note_id, "hide")} />
              )}
              <PixelButton text="삭제" onClick={() => runNoteAction(n.note_id, "delete")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

