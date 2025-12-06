import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PixelButton from "../components/PixelButton";
import api from "../api/axios";
import "./AdminList.css";
import { isAdminUser } from "../utils/auth";

export default function AdminLogs({ user }) {
  const navigate = useNavigate();
  const isAdmin = isAdminUser(user);
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const adminHeaders = useMemo(() => (user ? { "x-user-id": user.id } : {}), [user]);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/admin/logs", { headers: adminHeaders });
        setLogs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        setStatus(error.response?.data || "로그 조회 실패");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [isAdmin, navigate, adminHeaders]);

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <p className="eyebrow">ADMIN / LOGS</p>
        <h2>관리 로그</h2>
        <p className="lede">최근 관리 액션을 확인하세요. (최근 200건)</p>
        <PixelButton text="← 대시보드" onClick={() => navigate("/admin")} />
      </div>

      {loading && <div className="admin-status">로딩 중...</div>}
      {status && <div className="admin-status">{status}</div>}

      <div className="admin-list">
        <div className="admin-list-header logs-header">
          <span>시간</span>
          <span>관리자</span>
          <span>액션</span>
          <span>대상노트</span>
          <span>대상유저</span>
          <span>엔티티ID</span>
        </div>
        {logs.map((log, idx) => (
          <div className="admin-list-row logs-row" key={`${log.actiontime}-${idx}`}>
            <span>{new Date(log.actiontime).toLocaleString()}</span>
            <span>{log.admin_id}</span>
            <span className="label-strong">{log.action}</span>
            <span>{log.target_note}</span>
            <span>{log.user_id}</span>
            <span>{log.note_id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
