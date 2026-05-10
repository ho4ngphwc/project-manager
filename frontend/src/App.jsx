import React, { useState, useEffect } from 'react';
import AdminDashboard from './pages/admin/AdminDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';

export default function App() {  
  const [user, setUser] = useState(null); 

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('user_info');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }) 
      });
      const data = await res.json();

      if (res.ok) {
        if (data.requirePasswordChange) {
          setTempUserId(data.userId);
          setShowChangePasswordModal(true);
        } else { 
          localStorage.setItem('user_info', JSON.stringify(data.user));
          setUser(data.user);
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Không thể kết nối đến máy chủ.");
    }
  };

  const handleChangePassword = async () => {
  
    if (newPassword.length < 6) return setError("Mật khẩu phải có ít nhất 6 ký tự!"); 
    
    try {
      const res = await fetch('/api/users/change-password',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, newPassword })
      });
      if (res.ok) {
        alert("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.");
        setShowChangePasswordModal(false);
        setPassword('');
      } else {
        setError("Lỗi đổi mật khẩu!");
      }
    } catch (err) {
      setError("Lỗi kết nối khi đổi mật khẩu!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_info');
    setUser(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-xl">V</div>
            <h1 className="text-2xl font-black text-blue-900 tracking-wider">WORKSPACE</h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <p className="text-red-500 text-sm text-center font-bold">{error}</p>}
            <input 
              type="email" placeholder="Email nội bộ" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500" 
            />
            <input 
              type="password" placeholder="Mật khẩu" required
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500" 
            />
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">
              Đăng Nhập
            </button>
          </form>
        </div>

        {showChangePasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
              <h2 className="text-xl font-bold text-slate-800 mb-2">🔒 Cập nhật bảo mật</h2>
              <p className="text-sm text-slate-600 mb-6">Đây là lần đầu bạn đăng nhập. Theo quy định, vui lòng đổi mật khẩu mới để tiếp tục.</p>
              {error && <p className="text-red-500 text-sm mb-4 font-bold">{error}</p>}
              <input 
                type="password" placeholder="Nhập mật khẩu mới..."
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:border-blue-500 mb-4" 
              />
              <button onClick={handleChangePassword} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition">
                Xác nhận đổi mật khẩu
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN ĐÃ ĐĂNG NHẬP
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center sticky top-0 z-40">
        
        {/* --- ĐÃ NÂNG CẤP: LOGO CÓ THỂ BẤM ĐỂ PHÁT TÍN HIỆU QUAY LẠI --- */}
        <div 
          onClick={() => window.dispatchEvent(new Event('goHome'))}
          className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity"
          title="Quay lại danh sách dự án"
        >
          <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold">V</div>
          <h1 className="text-xl font-black text-blue-900 tracking-wider">WORKSPACE</h1>
        </div>
        {/* ----------------------------------------------------------- */}

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="font-bold text-slate-800 leading-tight">{user.fullName}</p>
            <p className="text-xs font-bold text-blue-600 uppercase">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="text-sm font-bold text-slate-500 hover:text-red-600 transition">
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="p-6">
        {(user.role === 'admin' || user.role === 'ADMIN') ? (
          <AdminDashboard />
        ) : (
          <EmployeeDashboard currentUser={user} />
        )}
      </main>

    </div>
  );
}