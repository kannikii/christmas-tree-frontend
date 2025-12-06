export const isAdminUser = (user) => {
  if (!user) return false;
  const flag = user.is_admin;
  if (flag === 1 || flag === '1' || flag === true || flag === 'true') return true;
  if (Number(flag) === 1) return true;
  // fallback: 특정 관리자 ID 허용 (DB 변경 없이)
  if (Number(user.id) === 4 || Number(user.user_id) === 4) return true;
  return false;
};
