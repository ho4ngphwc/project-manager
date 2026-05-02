import React, { useState } from 'react'; 
import { Trash2, Edit3, ExternalLink, Clock } from 'lucide-react'; 

export default function AdminOverview({ projects, tasks, employees, fetchData, onOpenProject }) {
    const [newProjectName, setNewProjectName] = useState(''); 
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState(''); 

    // --- 1. HÀM TẠO DỰ ÁN MỚI ---
    const handleCreateProject = async () => {
        if (!newProjectName) return alert('Vui lòng nhập tên dự án!');
        try {
            const res = await fetch('/api/projects', {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName })
            });
            if (res.ok) {
                alert('Tạo dự án thành công!');
                setNewProjectName('');
                fetchData(); 
            }
        } catch (error) { alert("Lỗi kết nối máy chủ!"); }
    };

    // --- 2. HÀM SỬA TÊN DỰ ÁN ---
    const handleEditProject = async (id, currentName) => {
        const newName = prompt("Nhập tên mới cho dự án:", currentName);
        if (!newName || newName === currentName) return;
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Không thể cập nhật tên!"); }
    };

    // --- 3. HÀM ĐỔI TRẠNG THÁI DỰ ÁN ---
    const handleStatusChange = async (id, status) => {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi đổi trạng thái!"); }
    };

    // --- 4. HÀM XÓA DỰ ÁN ---
    const handleDeleteProject = async (id, name) => {
        if (!window.confirm(`Xác nhận xóa vĩnh viễn dự án: ${name}?`)) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi khi xóa!"); }
    };

    // --- 5. HÀM ADD USER VÀO PROJECT CỤ THỂ ---
    const handleAssignUser = async (projectId, value) => {
        if (!value) return; 

        let userIdsToAssign = [];

        if (value === 'ALL') {
            userIdsToAssign = employees.map(emp => emp.id); 
            if (!window.confirm(`Thêm TẤT CẢ ${employees.length} nhân viên vào dự án này?`)) return; 
        } else {
            userIdsToAssign = [parseInt(value)]
        }
        try {
            const res = await fetch(`/api/projects/${projectId}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: userIdsToAssign })
            });

            const data = await res.json();

            if (res.ok) {
                alert("Đã thêm thành viên!");
                fetchData();
            } else {
                alert("Lỗi từ server: " + data.error);
            }
        } catch (error) { alert("Lỗi khi gán nhân sự!"); }
    };

    // --- 6. HÀM GỠ NHÂN VIÊN KHỎI DỰ ÁN --- 
    const handleRemoveMember = async (projectId, userId, userName) => {
        if (!window.confirm(`Bạn có chắc muốn gỡ "${userName}" khỏi dự án này không?`)) return; 

        try {
            const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert("Lỗi từ server: " + data.error);
            }
        } catch (error) {
            alert("Lỗi kết nối khi gỡ nhân sự!");
        }
    };

    // --- 7. HÀM TẠO USER MỚI ---
    const handleCreateUser = async () => {
        if (!newUserName || !newUserEmail) return alert("Nhập đủ thông tin!");
        try {
            const res = await fetch('/api/users/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: newUserName, email: newUserEmail })
            });
            if (res.ok) {
                alert("Cấp tài khoản thành công!");
                setNewUserName(''); setNewUserEmail('');
                fetchData();
            }
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    // --- 8. HÀM XOÁ USER RA KHỎI HỆ THỐNG ---
    const handleDeleteEmployee = async (id, name) => {
        if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xoá nhân viên "${name}"? \nToàn bộ công việc của người này sẽ mất theo!`)) return;
        try {
            const res = await fetch(`/api/users/delete/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();

            if (res.ok) {
                alert("Đã xoá thành công!");
                fetchData();
            } else {
                alert(data.error);
            }
        } catch (error) {
            alert("Lỗi kết nối đến server");
        }
    };

    return (
        <div className="space-y-6 p-4">
            {/* HEADER */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Quản Lý Hệ Thống CNC</h1>
                <button onClick={fetchData} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition">
                    🔄 Làm mới
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CỘT TRÁI: DỰ ÁN */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-xl mb-6">📂 Danh Sách Dự Án</h3>
                        
                        {/* Form tạo dự án */}
                        <div className="flex gap-2 mb-6">
                            <input 
                                value={newProjectName} 
                                onChange={e => setNewProjectName(e.target.value)} 
                                className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
                                placeholder="Tên dự án mới..." 
                            />
                            <button onClick={handleCreateProject} className="bg-slate-800 text-white px-6 rounded-xl font-bold hover:bg-black transition">
                                + Tạo
                            </button>
                        </div>

                        {/* Grid Dự án */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {projects.map(p => (
                                <div key={p.id} className="p-5 border-2 border-slate-50 rounded-2xl hover:border-blue-200 transition-all bg-white shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
                                                <button onClick={() => handleEditProject(p.id, p.name)} className="text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button>
                                            </div>
                                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock size={10}/> {new Date(p.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        <select 
                                            value={p.status} 
                                            onChange={(e) => handleStatusChange(p.id, e.target.value)}
                                            className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none ${p.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}
                                        >
                                            <option value="Đang làm">ĐANG LÀM</option>
                                            <option value="Đã hoàn thành">HOÀN THÀNH</option>
                                        </select>
                                    </div>

                                    {/* PHẦN GÁN VÀ GỠ NHÂN VIÊN */}
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex -space-x-2 flex-1">
                                            {p.members?.map(m => (
                                                <button 
                                                    key={m.id} 
                                                    title={`Gỡ ${m.fullName} khỏi dự án`} 
                                                    onClick={() => handleRemoveMember(p.id, m.id, m.fullName)}
                                                    className="w-7 h-7 rounded-full bg-blue-500 hover:bg-red-500 text-white border-2 border-white flex items-center justify-center text-[10px] font-bold transition-all hover:z-10 hover:scale-110 relative cursor-pointer"
                                                >
                                                    {m.fullName.charAt(0)}
                                                </button>
                                            ))}
                                            <select
                                                value=""
                                                onChange={(e) => handleAssignUser(p.id, e.target.value)}
                                                className="w-7 h-7 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 cursor-pointer outline-none appearance-none text-center hover:bg-slate-200"
                                                title="Thêm nhân viên"
                                            >
                                                <option value="" disabled>+</option>
                                                <option value="ALL" className="font-bold text-blue-600 bg-blue-50">
                                                    Thêm TẤT CẢ ({employees.length} người)
                                                </option>

                                                <option disabled>----------------------</option>
                                                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                            </select>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button onClick={() => onOpenProject(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition"><ExternalLink size={16}/></button>
                                            <button onClick={() => handleDeleteProject(p.id, p.name)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: NHÂN SỰ */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg mb-4">👤 Cấp Tài Khoản</h3>
                        <div className="space-y-3">
                            <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Họ tên..." />
                            <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email..." />
                            <button onClick={handleCreateUser} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-black transition">Tạo (Pass: 123456)</button>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t">
                            <p className="text-sm font-bold text-slate-500 mb-3">Đội ngũ ({employees.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {employees.map(emp => (
                                    // Dùng 'group' của Tailwind để làm hiệu ứng hover
                                    <div key={emp.id} className="group flex items-center gap-1 bg-slate-100 pl-2 pr-1 py-1 rounded-md border border-slate-200 transition-all hover:bg-red-50 hover:border-red-200">
                                        <span className="text-[11px] font-medium text-slate-700">{emp.fullName}</span>
                                        
                                        {/* Nút xóa: Bình thường tàng hình (opacity-0), di chuột vào mới hiện lên (group-hover:opacity-100) */}
                                        <button 
                                            onClick={() => handleDeleteEmployee(emp.id, emp.fullName)}
                                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                            title={`Trảm ${emp.fullName}`}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}