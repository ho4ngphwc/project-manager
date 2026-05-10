import React, { useState } from 'react'; 
import { Trash2, Edit3, Clock, Filter } from 'lucide-react'; // Đã gỡ ExternalLink

export default function AdminOverview({ projects, tasks, employees, fetchData, onOpenProject }) {
    const [newProjectName, setNewProjectName] = useState(''); 
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState(''); 
    
    // --- BỘ LỌC DỰ ÁN ---
    const [projectFilter, setProjectFilter] = useState('DANG_LAM'); 

    const handleCreateProject = async () => {
        if (!newProjectName) return alert('Vui lòng nhập tên dự án!');
        try {
            const res = await fetch('/api/projects', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newProjectName })
            });
            if (res.ok) { alert('Tạo dự án thành công!'); setNewProjectName(''); fetchData(); }
        } catch (error) { alert("Lỗi kết nối máy chủ!"); }
    };

    const handleEditProject = async (id, currentName) => {
        const newName = prompt("Nhập tên mới cho dự án:", currentName);
        if (!newName || newName === currentName) return;
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Không thể cập nhật tên!"); }
    };

    const handleStatusChange = async (id, status) => {
        try {
            const res = await fetch(`/api/projects/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi đổi trạng thái!"); }
    };

    const handleDeleteProject = async (id, name) => {
        if (!window.confirm(`Xác nhận xóa vĩnh viễn dự án: ${name}?`)) return;
        try {
            const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi khi xóa!"); }
    };

    const handleAssignUser = async (projectId, value) => {
        if (!value) return; 
        let userIdsToAssign = value === 'ALL' ? employees.map(emp => emp.id) : [parseInt(value)];
        if (value === 'ALL' && !window.confirm(`Thêm TẤT CẢ ${employees.length} nhân viên?`)) return;

        try {
            const res = await fetch(`/api/projects/${projectId}/assign`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: userIdsToAssign })
            });
            if (res.ok) { alert("Đã thêm thành viên!"); fetchData(); }
        } catch (error) { alert("Lỗi khi gán nhân sự!"); }
    };

    const handleRemoveMember = async (projectId, userId, userName) => {
        if (!window.confirm(`Gỡ "${userName}" khỏi dự án?`)) return; 
        try {
            const res = await fetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const handleCreateUser = async () => {
        if (!newUserName || !newUserEmail) return alert("Nhập đủ thông tin!");
        try {
            const res = await fetch('/api/users/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName: newUserName, email: newUserEmail })
            });
            if (res.ok) { alert("Cấp tài khoản thành công!"); setNewUserName(''); setNewUserEmail(''); fetchData(); }
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const handleDeleteEmployee = async (id, name) => {
        if (!window.confirm(`Xoá nhân viên "${name}"?`)) return;
        try {
            const res = await fetch(`/api/users/delete/${id}`, { method: 'DELETE' });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const filteredProjects = projects.filter(p => {
        if (projectFilter === 'ALL') return true;
        if (projectFilter === 'DANG_LAM') return p.status !== 'Đã hoàn thành';
        if (projectFilter === 'HOAN_THANH') return p.status === 'Đã hoàn thành';
        return true;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); 

    return (
        <div className="space-y-6 p-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <h1 className="text-2xl font-bold text-slate-800">Quản Lý Hệ Thống CNC</h1>
                <button onClick={fetchData} className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl transition">
                    🔄 Làm mới dữ liệu
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">📂 Danh Sách Dự Án</h3>
                            
                            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                                <button onClick={() => setProjectFilter('DANG_LAM')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${projectFilter === 'DANG_LAM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Đang làm</button>
                                <button onClick={() => setProjectFilter('HOAN_THANH')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${projectFilter === 'HOAN_THANH' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Hoàn thành</button>
                                <button onClick={() => setProjectFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${projectFilter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Tất cả</button>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mb-8">
                            <input value={newProjectName} onChange={e => setNewProjectName(e.target.value)} className="flex-1 p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" placeholder="Tên dự án mới..." />
                            <button onClick={handleCreateProject} className="bg-blue-600 text-white px-8 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">+ Tạo Dự Án</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredProjects.length === 0 ? (
                                <div className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 font-medium">Không tìm thấy dự án nào trong mục này.</p>
                                </div>
                            ) : (
                                filteredProjects.map(p => (
                                    <div key={p.id} className={`p-5 border-2 rounded-2xl transition-all bg-white shadow-sm hover:shadow-md ${p.status === 'Đã hoàn thành' ? 'border-green-100 opacity-80' : 'border-slate-50 hover:border-blue-200'}`}>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    {/* --- ĐÃ NÂNG CẤP: BẤM VÀO TÊN ĐỂ MỞ DỰ ÁN --- */}
                                                    <h4 onClick={() => onOpenProject(p)} className={`font-bold text-lg cursor-pointer transition-colors ${p.status === 'Đã hoàn thành' ? 'text-slate-500 line-through' : 'text-slate-800 hover:text-blue-600'}`}>{p.name}</h4>
                                                    <button onClick={() => handleEditProject(p.id, p.name)} className="text-slate-400 hover:text-blue-500"><Edit3 size={14}/></button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-1"><Clock size={10}/> {new Date(p.createdAt).toLocaleString('vi-VN')}</p>
                                            </div>
                                            <select value={p.status} onChange={(e) => handleStatusChange(p.id, e.target.value)} className={`text-[10px] font-bold px-2 py-1 rounded-lg border-none outline-none cursor-pointer ${p.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                <option value="Đang làm">ĐANG LÀM</option>
                                                <option value="Đã hoàn thành">HOÀN THÀNH</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                                            <div className="flex -space-x-2 flex-1">
                                                {p.members?.map(m => (
                                                    <button 
                                                        key={m.id} 
                                                        title={`Gỡ ${m.fullName}`} 
                                                        onClick={() => handleRemoveMember(p.id, m.id, m.fullName)}
                                                        className="w-7 h-7 rounded-full bg-blue-500 hover:bg-red-500 text-white border-2 border-white flex items-center justify-center text-[10px] font-bold transition-all hover:z-10 hover:scale-110 relative cursor-pointer"
                                                    >
                                                        {m.fullName.charAt(0)}
                                                    </button>
                                                ))}
                                                
                                                {/* --- GIỮ NGUYÊN NÚT THÊM NHÂN VIÊN GỐC CỦA BÁC --- */}
                                                <select
                                                    value=""
                                                    onChange={(e) => handleAssignUser(p.id, e.target.value)}
                                                    // Sửa css một tí xíu: Bỏ 'flex' đi để cái chữ + không bị méo thành dấu - nữa
                                                    className="w-7 h-7 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 cursor-pointer outline-none appearance-none text-center hover:bg-slate-200"
                                                    title="Thêm nhân viên"
                                                >
                                                    <option value="" disabled>+</option>
                                                    <option value="ALL" className="font-bold text-blue-600 bg-blue-50">
                                                        Thêm TẤT CẢ ({employees.length} người)
                                                    </option>

                                                    <option disabled>----------------------</option>
                                                    {employees.map(e => <option key={e.id} value={e.id}>{e.fullName}</option>)}
                                                </select>
                                                {/* ----------------------------------------------- */}
                                            </div>
                                            
                                            <div className="flex gap-1">
                                                <button onClick={() => handleDeleteProject(p.id, p.name)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-lg mb-4">👤 Cấp Tài Khoản</h3>
                        <div className="space-y-3">
                            <input value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Họ tên..." />
                            <input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email..." />
                            <button onClick={handleCreateUser} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-black transition">Tạo (Pass: 123456)</button>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <p className="text-sm font-bold text-slate-500 mb-3">Đội ngũ thợ ({employees.length})</p>
                            <div className="flex flex-wrap gap-2">
                                {employees.map(emp => (
                                    <div key={emp.id} className="group flex items-center gap-1 bg-slate-50 pl-2 pr-1 py-1 rounded-md border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-all">
                                        <span className="text-[11px] font-medium text-slate-700">{emp.fullName}</span>
                                        <button onClick={() => handleDeleteEmployee(emp.id, emp.fullName)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
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