import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, CheckCircle, Clock, MessageSquare, Image as ImageIcon, Download, HandMetal, CheckSquare, XCircle, RotateCcw, Filter, Bell, Heart } from 'lucide-react';

const formatFileName = (path) => {
    if (!path) return '';
    const cleanPath = path.replace(/\\/g, '/');
    const fileName = cleanPath.split('/').pop();
    const parts = fileName.split('-');
    if (parts.length > 1) { parts.shift(); return parts.join('-'); }
    return fileName;
};

const getFileUrl = (filePath) => {
    if (!filePath) return '';
    const cleanPath = filePath.replace(/\\/g, '/');
    const uploadsIndex = cleanPath.indexOf('uploads/');
    if (uploadsIndex !== -1) return `/${cleanPath.substring(uploadsIndex)}`;
    return cleanPath;
};

const isImageFile = (filePath) => {
    if (!filePath) return false;
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filePath);
};

const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function EmployeeWorkspace({ project, tasks, fetchData, onBack, currentUser }) {
    const rooms = project?.rooms || [];
    const projectTasks = tasks?.filter(t => t.projectId === project?.id) || [];

    const sortedRooms = [...rooms].sort((a, b) => {
        if (a.createdAt && b.createdAt) return new Date(b.createdAt) - new Date(a.createdAt);
        return b.id - a.id;
    });

    const [taskFilter, setTaskFilter] = useState('ALL');

    // --- LOGIC MỚI: THEO DÕI VÀ PHÁT ÂM THANH THÔNG BÁO ---
    const prevTasksRef = useRef();

    useEffect(() => {
        if (!tasks || !project) return;

        // Nếu là lần đầu load trang, chỉ lưu lại dữ liệu chứ không kêu
        if (!prevTasksRef.current) {
            prevTasksRef.current = tasks;
            return;
        }

        const oldTasks = prevTasksRef.current.filter(t => t.projectId === project.id);
        const newTasks = tasks.filter(t => t.projectId === project.id);

        let hasNewAdminAction = false;

        // 1. Kiểm tra xem Sếp có thêm việc mới không
        if (newTasks.length > oldTasks.length) {
            hasNewAdminAction = true;
        } else {
            // 2. Kiểm tra xem Sếp có nhắn tin mới không (tin nhắn có userId = null)
            const countAdminNotes = (taskList) => taskList.reduce((sum, t) => sum + (t.notes?.filter(n => !n.userId).length || 0), 0);

            if (countAdminNotes(newTasks) > countAdminNotes(oldTasks)) {
                hasNewAdminAction = true;
            }
        }

        // Kích hoạt âm thanh
        if (hasNewAdminAction) {
            // Tiếng "Ting" thông báo có sẵn trên mạng
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
            audio.play().catch(err => {
                console.log("Trình duyệt chặn tự động phát nhạc (Thợ cần click chuột vào màn hình 1 lần trước khi chuông có thể kêu):", err);
            });
        }

        // Cập nhật lại bộ nhớ
        prevTasksRef.current = tasks;
    }, [tasks, project]);

    useEffect(() => {
        const intervalId = setInterval(() => { if (fetchData) fetchData(); }, 5000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    useEffect(() => {
        const handleGoHome = () => { if (onBack) onBack(); };
        window.addEventListener('goHome', handleGoHome);
        return () => window.removeEventListener('goHome', handleGoHome);
    }, [onBack]);

    const handleAcceptTask = async (taskId) => {
        if (!currentUser?.id) return alert("Lỗi phiên đăng nhập!");
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: parseInt(currentUser.id), isAccepted: true, status: 'DOING' })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const handleCancelAccept = async (taskId) => {
        if (!window.confirm("Nhả việc này ra cho người khác?")) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: null, isAccepted: false, status: 'TODO' })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const handleCompleteTask = async (taskId) => {
        if (!window.confirm("Xác nhận đã xong?")) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DONE' })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const handleUndoComplete = async (taskId) => {
        if (!window.confirm("Hoàn tác trạng thái chưa xong?")) return;
        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DOING' })
            });
            if (res.ok) fetchData();
        } catch (error) { alert("Lỗi kết nối!"); }
    };

    const checkUnreadAdminNote = (task, currentUserId) => {
        if (task.userId && task.userId !== parseInt(currentUserId)) return false;
        if (!task.notes || task.notes.length === 0) return false;
        const lastNote = task.notes[task.notes.length - 1];
        return !lastNote.userId;
    };

    const handlePasteNoteImage = async (e, taskId) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        let imageFile = null;
        for (let item of items) {
            if (item.type.startsWith('image/')) {
                imageFile = item.getAsFile();
                break;
            }
        }

        if (!imageFile) return;
        e.preventDefault();

        e.target.placeholder = "Đang tải ảnh lên...";
        e.target.disabled = true;

        try {
            const formData = new FormData();
            formData.append('file', imageFile);

            const uploadRes = await fetch('/api/uploads', {
                method: 'POST', body: formData
            });

            if (!uploadRes.ok) throw new Error('Lỗi upload');
            const uploadData = await uploadRes.json();
            const finalUrl = uploadData.fileUrl || uploadData.filePath;

            await fetch(`/api/tasks/${taskId}/notes`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: `[IMAGE]${finalUrl}`, userId: parseInt(currentUser.id) })
            });

            fetchData();
        } catch (err) {
            alert("Không thể dán ảnh, vui lòng thử lại!");
        } finally {
            e.target.placeholder = "Báo cáo sếp... (Ctrl+V dán ảnh)";
            e.target.disabled = false;
            e.target.value = '';
            e.target.focus();
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen -m-6 p-6">
            <div className="flex justify-end items-center mb-6">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${project?.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                        {project?.status || 'Đang làm'}
                    </span>
                    <span className="text-slate-400 text-sm font-medium">Dự án: <span className="text-slate-900">{project?.name || 'Đang tải...'}</span></span>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">

                <div className="bg-slate-800 px-6 py-3 flex justify-between items-center text-white sticky top-0 z-50 shadow-md border-b-2 border-orange-500 rounded-t-2xl">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-bold uppercase">{project?.name || 'Đang tải...'}</h2>
                        <p className="text-slate-300 text-xs border-l border-slate-600 pl-4 flex items-center gap-1">
                            Không gian nhận việc
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-bold text-slate-600 flex items-center gap-1 mr-2"><Filter size={16} /> Lọc việc:</span>
                    <button onClick={() => setTaskFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tất cả</button>
                    <button onClick={() => setTaskFilter('CHUA_NHAN')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'CHUA_NHAN' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>Chưa ai nhận</button>
                    <button onClick={() => setTaskFilter('MY_TASKS')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'MY_TASKS' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Việc của tôi</button>
                    <button onClick={() => setTaskFilter('DA_XONG')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'DA_XONG' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>Đã xong</button>

                    <button
                        onClick={() => setTaskFilter('CO_NOTE')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${taskFilter === 'CO_NOTE' ? 'bg-red-500 text-white shadow-md ring-2 ring-red-300' : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'}`}
                    >
                        Tin nhắn sếp <Bell size={12} className={taskFilter === 'CO_NOTE' ? '' : 'animate-bounce'} />
                    </button>
                </div>

                <div className="p-6 bg-slate-50">
                    {rooms.length === 0 ? (
                        <div className="text-center py-20"><p className="text-slate-500 font-medium">Sếp chưa tạo phòng nào.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                            {sortedRooms.map(room => {
                                const roomTasks = projectTasks.filter(t => t.roomId === room.id);

                                const displayTasks = roomTasks.filter(t => {
                                    if (taskFilter === 'ALL') return true;
                                    if (taskFilter === 'CHUA_NHAN') return !t.userId;
                                    if (taskFilter === 'MY_TASKS') return t.userId === parseInt(currentUser?.id) && t.status !== 'DONE';
                                    if (taskFilter === 'DA_XONG') return t.status === 'DONE';
                                    if (taskFilter === 'CO_NOTE') return checkUnreadAdminNote(t, currentUser?.id);
                                    return true;
                                }).sort((a, b) => {
                                    const aUnread = checkUnreadAdminNote(a, currentUser?.id);
                                    const bUnread = checkUnreadAdminNote(b, currentUser?.id);

                                    if (aUnread && !bUnread) return -1;
                                    if (!aUnread && bUnread) return 1;

                                    if (a.status === 'DONE' && b.status !== 'DONE') return 1;
                                    if (a.status !== 'DONE' && b.status === 'DONE') return -1;

                                    return b.id - a.id;
                                });

                                if (displayTasks.length === 0 && roomTasks.length > 0) return null;
                                if (roomTasks.length === 0 && taskFilter !== 'ALL') return null;

                                return (
                                    <div key={room.id} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
                                        <div className="p-4 bg-slate-100 flex justify-between items-center border-b border-slate-200">
                                            <h3 className="font-bold text-slate-800 text-base truncate pr-2 flex items-center gap-2">
                                                {room.name}
                                                {room.createdAt && <span className="text-[10px] text-slate-400 font-normal bg-slate-200/50 px-1.5 py-0.5 rounded flex items-center gap-1"><Clock size={10} /> {formatDateTime(room.createdAt)}</span>}
                                            </h3>
                                            <span className="text-xs font-bold bg-white text-slate-500 px-2 py-1 rounded-md border">{roomTasks.length} mục</span>
                                        </div>

                                        <div className="p-3 space-y-3 flex-1 bg-slate-50/30">
                                            {displayTasks.length === 0 ? (
                                                <p className="text-xs text-slate-400 italic text-center py-8">Trống.</p>
                                            ) : (
                                                displayTasks.map(task => {
                                                    const fileUrl = getFileUrl(task.filePath);
                                                    const isImg = isImageFile(task.filePath);
                                                    const isMyTask = currentUser && task.userId === parseInt(currentUser.id);
                                                    const hasUnreadNote = checkUnreadAdminNote(task, currentUser?.id);

                                                    return (
                                                        <div key={task.id} className={`flex flex-col gap-3 p-3 rounded-xl border transition-all shadow-sm relative ${hasUnreadNote ? 'border-2 border-red-400 bg-red-50/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]' :
                                                            task.status === 'DONE' ? 'border-green-200 bg-green-50/30 opacity-70' :
                                                                isMyTask ? 'border-blue-300 bg-blue-50' :
                                                                    task.userId ? 'border-slate-200 bg-slate-100 opacity-60' : 'border-orange-200 bg-white hover:border-orange-400'
                                                            }`}>

                                                            {hasUnreadNote && (
                                                                <div className="absolute -top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-pulse z-10">
                                                                    <Bell size={10} /> SẾP NHẮN
                                                                </div>
                                                            )}

                                                            {task.filePath ? (
                                                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full h-40 mt-2 bg-white rounded-lg flex items-center justify-center text-blue-500 shrink-0 border border-slate-200 overflow-hidden group">
                                                                    {isImg ? (
                                                                        <img src={fileUrl} alt="Thumbnail" className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                                                                    ) : (
                                                                        <Download size={32} />
                                                                    )}
                                                                </a>
                                                            ) : (
                                                                <div className="w-full h-40 mt-2 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 border border-dashed border-slate-200"><ImageIcon size={32} /></div>
                                                            )}

                                                            <div className="min-w-0 flex-1">
                                                                <h4 className={`font-bold text-[14px] truncate transition-all ${task.status === 'DONE' ? 'line-through text-slate-300' : 'text-slate-800'}`}>
                                                                    {task.material?.trim() ? task.material : 'Trống VL'} - {task.title?.trim() ? task.title : 'Trống Tên'}
                                                                </h4>

                                                                <div className="text-[11px] text-slate-500 space-y-1 mt-1">
                                                                    <p className="truncate">File: <span className="text-blue-500 font-bold">{task.filePath ? formatFileName(task.filePath) : '---'}</span></p>
                                                                    <p>Giao lúc: {formatDateTime(task.createdAt)}</p>
                                                                </div>

                                                                <div className="mt-3">
                                                                    {task.status === 'DONE' ? (
                                                                        <div className="flex flex-col gap-1 items-start">
                                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold"><CheckCircle size={14} /> Đã xong</span>
                                                                            {task.completedAt && (
                                                                                <span className="text-[10px] text-green-600 font-bold mt-1">Xong lúc: {formatDateTime(task.completedAt)}</span>
                                                                            )}
                                                                            {isMyTask && <button onClick={() => handleUndoComplete(task.id)} className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-md transition mt-1"><RotateCcw size={14} /> Sửa lại</button>}
                                                                        </div>
                                                                    ) : !task.userId ? (
                                                                        <button onClick={() => handleAcceptTask(task.id)} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-md active:scale-95"><HandMetal size={18} /> Nhận Việc Này</button>
                                                                    ) : isMyTask ? (
                                                                        <div className="flex gap-2">
                                                                            <button onClick={() => handleCancelAccept(task.id)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition" title="Nhả việc"><XCircle size={18} /></button>
                                                                            <button onClick={() => handleCompleteTask(task.id)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-md active:scale-95"><CheckSquare size={18} /> Đã hoàn thành</button>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold">🔒 {task.user?.fullName || 'Nhân viên'} đang làm</div>
                                                                    )}
                                                                </div>

                                                                <div className="border-t border-slate-100 pt-3 mt-3">
                                                                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto scrollbar-thin pr-1 flex flex-col">
                                                                        {task.notes && task.notes.map(n => {
                                                                            const isAdmin = !n.userId;
                                                                            const senderName = isAdmin ? "Sếp" : (n.user?.fullName ? n.user.fullName.split(' ').pop() : 'Thợ');
                                                                            const isImageNote = n.content.startsWith('[IMAGE]');
                                                                            const noteContent = isImageNote ? n.content.replace('[IMAGE]', '') : n.content;

                                                                            return (
                                                                                <div key={n.id} className="text-[13px] leading-relaxed flex gap-2 items-start bg-white/50 p-1.5 rounded-lg">
                                                                                    <div className="flex-1">
                                                                                        <span className={`font-bold ${isAdmin ? 'text-red-600' : 'text-blue-600'}`}>{senderName}: </span>

                                                                                        <span className="text-[10px] text-slate-400 font-normal ml-1.5">({formatDateTime(n.createdAt)})</span>

                                                                                        {isImageNote ? (
                                                                                            <a href={getFileUrl(noteContent)} target="_blank" rel="noopener noreferrer" className="block mt-1">
                                                                                                <img src={getFileUrl(noteContent)} alt="Ghi chú hình ảnh" className="max-w-full h-auto max-h-[120px] rounded-lg border border-slate-200 shadow-sm object-contain bg-white hover:opacity-90 transition" />
                                                                                            </a>
                                                                                        ) : (
                                                                                            <span className="text-slate-700 ml-1">{noteContent}</span>
                                                                                        )}
                                                                                    </div>

                                                                                    {n.isLiked && (
                                                                                        <div className="mt-0.5 p-1.5 flex shrink-0 text-red-500" title="Sếp đã duyệt tin nhắn này">
                                                                                            <Heart size={14} className="fill-current scale-110" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        placeholder={hasUnreadNote ? "Trả lời sếp... (Ctrl+V dán ảnh)" : "Báo cáo sếp... (Ctrl+V dán ảnh)"}
                                                                        className={`w-full border rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 bg-white shadow-sm transition-colors note-input-field ${hasUnreadNote ? 'border-red-300 focus:ring-red-400 bg-red-50/50' : 'border-slate-200 focus:ring-blue-400'}`}
                                                                        onPaste={(e) => handlePasteNoteImage(e, task.id)}
                                                                        onKeyDown={async (e) => {
                                                                            if (e.key === 'Enter') {
                                                                                if (e.nativeEvent.isComposing) return;
                                                                                const val = e.target.value;
                                                                                if (!val.trim() || !currentUser?.id) return;
                                                                                e.target.value = '';
                                                                                await fetch(`/api/tasks/${task.id}/notes`, {
                                                                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ content: val, userId: parseInt(currentUser.id) })
                                                                                });
                                                                                fetchData();
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="pb-6 text-center text-[10px] font-medium text-slate-400 bg-slate-50">
                    © {new Date().getFullYear()} Workspace Management - Crafted by Hoàng Phúc (Sol)
                </div>
            </div>
        </div>
    );
}