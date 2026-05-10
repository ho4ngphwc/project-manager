import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FolderPlus, Trash2, CheckCircle, Clock, AlertCircle, MessageSquare, Image, Download, Edit, Filter } from 'lucide-react';

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
    if (uploadsIndex !== -1) {
        const relativePath = cleanPath.substring(uploadsIndex);
        return `/${relativePath}`; 
    }
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
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminWorkspace({ project, tasks, employees, fetchData, onBack }) {
  const rooms = project?.rooms || [];
  const projectTasks = tasks?.filter(t => t.projectId === project?.id) || [];
  const currentAdminName = "Sếp Tâm";

  const [roomId, setRoomId] = useState('');
  const [material, setMaterial] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState(''); 
  const [selectedFile, setSelectedFile] = useState(null);

  const [editingTask, setEditingTask] = useState(null);
  const [editFile, setEditFile] = useState(null); 

  const [taskFilter, setTaskFilter] = useState('ALL'); 

  useEffect(() => {
    if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0].id);
    }
  }, [rooms]);

  const handleAssignTask = async () => {
    if (!roomId) return alert("Vui lòng tạo phòng trước khi thêm file cắt!");
    try {
      const selectedRoom = rooms.find(r => r.id === parseInt(roomId));
      const formData = new FormData();
      formData.append('projectId', project.id);
      formData.append('projectName', project.name);
      formData.append('roomId', roomId);
      formData.append('roomName', selectedRoom ? selectedRoom.name : 'Unknown');
      formData.append('material', material);
      formData.append('title', title);
      formData.append('note', note); 
      if (selectedFile) formData.append('file', selectedFile);

      const response = await fetch('/api/tasks', { method: 'POST', body: formData });
      if (response.ok) {
        alert("🎉 Đã thêm việc lên hệ thống thành công!");
        setMaterial(''); setTitle(''); setNote(''); setSelectedFile(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        fetchData();
      }
    } catch (error) { alert("Lỗi kết nối!"); }
  };

  const handleSaveEdit = async () => {
      if (!editingTask) return;
      try {
          const formData = new FormData();
          formData.append('material', editingTask.material || '');
          formData.append('title', editingTask.title || '');
          const selectedRoom = rooms.find(r => r.id === editingTask.roomId);
          formData.append('projectName', project.name);
          formData.append('roomName', selectedRoom ? selectedRoom.name : 'Unknown');
          if (editFile) formData.append('file', editFile);

          const response = await fetch(`/api/tasks/${editingTask.id}`, { method: 'PUT', body: formData });
          if (response.ok) { setEditingTask(null); setEditFile(null); fetchData(); }
      } catch (error) { alert("Lỗi cập nhật!"); }
  };

  const handleDeleteTask = async (taskId) => {
      if (!window.confirm("Xóa mục này?")) return;
      try {
          const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
          if (res.ok) fetchData();
      } catch (error) { alert("Lỗi khi xóa!"); }
  };

  const handleAddRoom = async () => {
    const roomName = prompt("Nhập tên phòng mới:");
    if (!roomName) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/rooms`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: roomName })
      });
      if (res.ok) fetchData();
    } catch (error) { alert("Lỗi tạo phòng!"); }
  };

  const handleDeleteRoom = async (rId, rName) => {
    if (!window.confirm(`Xóa phòng "${rName}"?`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/rooms/${rId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) { alert("Lỗi khi xóa phòng!"); }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen -m-6 p-6">
      <div className="flex justify-end items-center mb-6">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${project.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
            {project.status || 'Đang làm'}
          </span>
          <span className="text-slate-400 text-sm font-medium">Dự án: <span className="text-slate-900">{project.name}</span></span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-6 flex justify-between items-center text-white">
          <div>
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-1">
              <Clock size={14}/> Khởi tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
          <button onClick={handleAddRoom} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/20">
            <FolderPlus size={18} /> Thêm phòng
          </button>
        </div>

        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-blue-600"/> Đăng ký danh mục cắt
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Vị trí phòng <span className="text-red-500">*</span></label>
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">-- Chọn --</option>
                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Vật liệu (Tùy chọn)</label>
              <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="VD: Inox vàng..." className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tên tấm/vách (Tùy chọn)</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Vách trái" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1 lg:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Ghi chú (Tùy chọn)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dặn dò thợ..." className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">File (Tùy chọn)</label>
              <input id="file-upload" type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="w-full border border-slate-200 rounded-xl p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer transition" />
            </div>
          </div>
          <button onClick={handleAssignTask} className="mt-5 w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
            + Thêm việc lên hệ thống
          </button>
        </div>

        {/* Filter Bar */}
        {rooms.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-wrap gap-2 items-center">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-1 mr-2">
                    <Filter size={16}/> Bộ lọc:
                </span>
                <button onClick={() => setTaskFilter('ALL')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Tất cả</button>
                <button onClick={() => setTaskFilter('CHUA_NHAN')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'CHUA_NHAN' ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>Chưa nhận</button>
                <button onClick={() => setTaskFilter('DANG_LAM')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'DANG_LAM' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>Đang làm</button>
                <button onClick={() => setTaskFilter('DA_XONG')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${taskFilter === 'DA_XONG' ? 'bg-green-600 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>Đã cắt xong</button>
            </div>
        )}

        <div className="p-6 bg-slate-50">
          {rooms.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
               <p className="text-slate-500 font-medium">Chưa có phòng nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
              {rooms.map(room => {
                const roomTasks = projectTasks.filter(t => t.roomId === room.id);
                const filteredTasks = roomTasks.filter(task => {
                    if (taskFilter === 'ALL') return true;
                    if (taskFilter === 'CHUA_NHAN') return !task.userId;
                    if (taskFilter === 'DANG_LAM') return task.userId && task.status !== 'DONE';
                    if (taskFilter === 'DA_XONG') return task.status === 'DONE';
                    return true;
                });
                
                const sortedTasks = [...filteredTasks].sort((a, b) => {
                    if (a.status === 'DONE' && b.status !== 'DONE') return 1; 
                    if (a.status !== 'DONE' && b.status === 'DONE') return -1; 
                    return 0; 
                });
                
                const materialSummary = {};
                roomTasks.forEach(task => {
                    const mat = task.material || 'Khác';
                    if (!materialSummary[mat]) materialSummary[mat] = { chuaNhan: 0, dangLam: 0, daCat: 0 };
                    if (task.status === 'DONE') materialSummary[mat].daCat++;
                    else if (task.userId) materialSummary[mat].dangLam++;
                    else materialSummary[mat].chuaNhan++;
                });

                return (
                  <div key={room.id} className="group border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col h-full">
                    <div className="p-4 bg-slate-100 flex justify-between items-center border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 text-base truncate pr-2">{room.name}</h3>
                      <button onClick={() => handleDeleteRoom(room.id, room.name)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 transition"><Trash2 size={16} /></button>
                    </div>

                    {Object.keys(materialSummary).length > 0 && (
                        <div className="p-4 border-b border-slate-100 bg-white">
                            <ul className="text-[12px] text-slate-600 space-y-1">
                                {Object.keys(materialSummary).map((mat, index) => {
                                    const isAllDone = materialSummary[mat].chuaNhan === 0 && materialSummary[mat].dangLam === 0 && materialSummary[mat].daCat > 0;
                                    return (
                                    <li key={index} className={`flex items-start gap-1.5 ${isAllDone ? 'line-through text-slate-300' : ''}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${isAllDone ? 'bg-green-400' : 'bg-slate-400'}`}></span>
                                        <div className="flex-1">
                                            <span className="font-bold">{mat}:</span> {materialSummary[mat].chuaNhan} chưa nhận, {materialSummary[mat].dangLam} đang làm, {materialSummary[mat].daCat} đã cắt
                                        </div>
                                    </li>
                                    )
                                })}
                            </ul>
                        </div>
                    )}

                    <div className="p-3 space-y-3 flex-1 bg-slate-50/30">
                      {sortedTasks.length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-6">Trống.</p>
                      ) : (
                        sortedTasks.map(task => {
                          const fileUrl = getFileUrl(task.filePath);
                          const isImg = isImageFile(task.filePath);

                          return (
                          <div key={task.id} className="flex flex-col gap-3 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all shadow-sm group/task">
                            
                            {task.filePath ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-full h-40 bg-slate-100 rounded-lg flex items-center justify-center text-blue-500 shrink-0 border border-slate-200 overflow-hidden">
                                  {isImg ? (
                                      <img src={fileUrl} alt="Thumbnail" className="w-full h-full object-contain" />
                                  ) : (
                                      <Download size={32} />
                                  )}
                                </a>
                            ) : (
                                <div className="w-full h-40 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 border border-dashed border-slate-200">
                                  <Image size={32} />
                                </div>
                            )}
                            
                            <div className="min-w-0 flex-1">
                              {editingTask?.id === task.id ? (
                                  <div className="bg-slate-50 p-2 rounded-lg border border-blue-200 space-y-2">
                                      <input value={editingTask.material || ''} onChange={e => setEditingTask({...editingTask, material: e.target.value})} className="w-full text-xs p-2 border rounded" placeholder="Vật liệu..." />
                                      <input value={editingTask.title || ''} onChange={e => setEditingTask({...editingTask, title: e.target.value})} className="w-full text-xs p-2 border rounded" placeholder="Tên vách..." />
                                      <div className="flex gap-2">
                                          <button onClick={handleSaveEdit} className="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-bold">Lưu</button>
                                          <button onClick={() => setEditingTask(null)} className="bg-slate-200 text-slate-600 px-3 py-1 rounded text-[10px] font-bold">Hủy</button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex justify-between items-start mb-1">
                                      <h4 className={`font-bold text-[14px] truncate transition-all ${task.status === 'DONE' ? 'line-through text-slate-300' : 'text-blue-700'}`}>
                                        {task.material?.trim() ? task.material : 'Trống VL'} - {task.title?.trim() ? task.title : 'Trống Tên'}
                                      </h4>
                                      <div className="flex gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                          <button onClick={() => setEditingTask(task)} className="p-1 text-slate-400 hover:text-blue-600"><Edit size={14}/></button>
                                          <button onClick={() => handleDeleteTask(task.id)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              )}
                              
                              <div className="text-[11px] text-slate-500 space-y-1.5 mt-2">
                                <p className="truncate">File: {task.filePath ? <span className="text-blue-500 font-bold">{formatFileName(task.filePath)}</span> : '---'}</p>
                                {task.userId && <p className="font-bold text-slate-700">Thợ: {task.user?.fullName}</p>}
                                
                                {/* --- ĐÃ NÂNG CẤP LẠI NÚT TRẠNG THÁI CHO NỔI BẬT --- */}
                                <div className="pt-1">
                                    {task.status === 'DONE' ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500 text-white rounded-md text-[10px] font-bold uppercase shadow-sm">
                                            <CheckCircle size={12}/> Đã xong
                                        </span>
                                    ) : task.userId ? (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500 text-white rounded-md text-[10px] font-bold uppercase shadow-sm">
                                            <Clock size={12}/> Đang làm
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 text-white rounded-md text-[10px] font-bold uppercase shadow-sm">
                                            <AlertCircle size={12}/> Đợi nhận
                                        </span>
                                    )}
                                </div>
                                {/* ------------------------------------------------ */}
                                
                              </div>

                              <div className="border-t border-slate-100 pt-3 mt-3">
                                <div className="space-y-2 mb-3 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pr-1">
                                  {task.notes && task.notes.map(n => (
                                    <div key={n.id} className="text-[13px] leading-relaxed">
                                        <span className={`font-bold ${!n.userId ? 'text-red-600' : 'text-blue-600'}`}>
                                            {!n.userId ? 'Sếp' : n.user?.fullName.split(' ').pop()}: 
                                        </span> 
                                        <span className="text-slate-700 ml-1">{n.content}</span>
                                    </div>
                                  ))}
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Nhắn thợ..." 
                                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                                  onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                          if (e.nativeEvent.isComposing) return;
                                          const val = e.target.value;
                                          if (!val.trim()) return;
                                          e.target.value = ''; 
                                          await fetch(`/api/tasks/${task.id}/notes`, {
                                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({ content: val })
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