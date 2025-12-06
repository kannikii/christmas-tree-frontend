import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PixelButton from "../components/PixelButton";
import api from "../api/axios";
import "./AdminList.css";
import { isAdminUser } from "../utils/auth";

export default function AdminComments({ user }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedUser = params.get("user");
  const isAdmin = isAdminUser(user);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(preselectedUser || "");
  const [comments, setComments] = useState([]);
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
      setComments([]);
      return;
    }
    const fetchComments = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/admin/users/${selectedUser}/comments`, { headers: adminHeaders });
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setStatus(error.response?.data || "댓글 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchComments();
  }, [selectedUser, adminHeaders]);

  const runCommentAction = async (commentId, action) => {
    try {
      setStatus(`요청 중: ${commentId} ${action}`);
      if (action === "delete") {
        await api.delete(`/admin/comments/${commentId}`, { headers: adminHeaders });
      } else {
        await api.patch(`/admin/comments/${commentId}/${action}`, null, { headers: adminHeaders });
      }
      setComments((prev) =>
        prev
          .map((c) =>
            Number(c.comment_id) === Number(commentId)
              ? { ...c, is_hidden: action === "hide" ? 1 : action === "show" ? 0 : c.is_hidden }
              : c
          )
          .filter((c) => (action === "delete" ? Number(c.comment_id) !== Number(commentId) : true))
      );
      setStatus(`✅ 완료: ${commentId} ${action}`);
    } catch (error) {
      console.error(error);
      setStatus(`❌ 실패: ${error.response?.data || error.message}`);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <p className="eyebrow">ADMIN / COMMENTS</p>
        <h2>댓글 관리</h2>
        <p className="lede">사용자를 선택하고 해당 사용자의 댓글을 관리하세요.</p>
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
          <span>노트</span>
          <span>내용</span>
          <span>상태</span>
          <span>액션</span>
        </div>
        {comments.map((c) => (
          <div className="admin-list-row" key={c.comment_id}>
            <span>{c.comment_id}</span>
            <span>{c.note_id}</span>
            <span className="ellipsis">{c.content}</span>
            <span>{c.is_hidden ? "숨김" : "표시"}</span>
            <div className="row-actions compact">
              {c.is_hidden ? (
                <PixelButton className="compact" text="표시" onClick={() => runCommentAction(c.comment_id, "show")} />
              ) : (
                <PixelButton className="compact" text="숨김" onClick={() => runCommentAction(c.comment_id, "hide")} />
              )}
              <PixelButton className="compact" text="삭제" onClick={() => runCommentAction(c.comment_id, "delete")} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
