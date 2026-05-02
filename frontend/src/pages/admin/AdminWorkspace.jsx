import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, FolderPlus, Trash2, CheckCircle, Clock, AlertCircle, MessageSquare, Image, Download, Edit } from 'lucide-react';

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

  useEffect(() => {
    if (rooms.length > 0 && !roomId) {
      setRoomId(rooms[0].id);
    }
    console.log(
      "%c🛑 CẢNH BÁO: %cHệ thống được thiết kế & bảo mật bởi Hoàng Phúc (Sol). Mọi hành vi sao chép đều vi phạm bản quyền!", 
      "color: red; font-size: 16px; font-weight: bold;", 
      "color: #2563eb; font-size: 14px; font-style: italic;"
    );
  }, [rooms]);

  const handleAssignTask = async () => {
    if (!roomId) return alert("Vui lòng tạo phòng trước khi thêm file cắt!");
    if (!material || !title) return alert("Vui lòng nhập đủ Vật liệu và Tên tấm/vách!");

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
      } else {
        alert("❌ Lỗi từ Server, không thể thêm dữ liệu!");
      }
    } catch (error) { alert("Lỗi kết nối đến máy chủ!"); }
  };

  const handleSaveEdit = async () => {
      if (!editingTask) return;
      try {
          const formData = new FormData();
          formData.append('material', editingTask.material || 'Chưa nhập vật liệu');
          formData.append('title', editingTask.title || 'Chưa nhập tên vách');
          
          const selectedRoom = rooms.find(r => r.id === editingTask.roomId);
          formData.append('projectName', project.name);
          formData.append('roomName', selectedRoom ? selectedRoom.name : 'Unknown');

          if (editFile) formData.append('file', editFile);

          const response = await fetch(`/api/tasks/${editingTask.id}`, {
              method: 'PUT', body: formData 
          });
          
          if (response.ok) {
              setEditingTask(null);
              setEditFile(null); 
              fetchData(); 
          } else { alert("Lỗi khi cập nhật!"); }
      } catch (error) { alert("Lỗi kết nối máy chủ!"); }
  };

  const handleDeleteTask = async (taskId) => {
      if (!window.confirm("Bạn có chắc muốn xóa mục này không? Nhân viên sẽ không thấy nữa!")) return;
      try {
          const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
          if (res.ok) fetchData();
      } catch (error) { alert("Lỗi khi xóa!"); }
  };

  const handleAddRoom = async () => {
    const roomName = prompt("Nhập tên phòng mới (VD: Tầng 1, Phòng Khách...):");
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
    if (!window.confirm(`Xóa phòng "${rName}" sẽ xóa sạch file bên trong. Bạn chắc chứ?`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}/rooms/${rId}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (error) { alert("Lỗi khi xóa phòng!"); }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen -m-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft size={18} /> Quay lại
        </button>
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
            <Plus size={16} className="text-blue-600"/> Đăng ký danh mục cắt (Thợ sẽ tự nhận việc)
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
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Vật liệu <span className="text-red-500">*</span></label>
              <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="VD: Inox vàng..." className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1 lg:col-span-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Tên tấm/vách <span className="text-red-500">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Vách trái" className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            
            <div className="space-y-1 lg:col-span-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase ml-1">Ghi chú (Tùy chọn)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Dặn dò thợ (sẽ lưu thành bình luận)..." className="w-full border border-slate-200 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" />
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

        <div className="p-6 bg-white">
          {rooms.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
               <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300 shadow-sm"><FolderPlus size={32} /></div>
               <p className="text-slate-500 font-medium">Dự án này chưa có phòng nào.</p>
               <button onClick={handleAddRoom} className="text-blue-600 font-bold text-sm mt-2 hover:underline">+ Tạo phòng ngay</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {rooms.map(room => {
                const roomTasks = projectTasks.filter(t => t.roomId === room.id);
                
                const materialSummary = {};
                roomTasks.forEach(task => {
                    const mat = task.material || 'Khác';
                    if (!materialSummary[mat]) {
                        materialSummary[mat] = { chuaNhan: 0, dangLam: 0, daCat: 0 };
                    }
                    if (task.status === 'DONE') {
                        materialSummary[mat].daCat++;
                    } else if (task.userId) {
                        materialSummary[mat].dangLam++;
                    } else {
                        materialSummary[mat].chuaNhan++;
                    }
                });

                return (
                  <div key={room.id} className="group border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        {room.name}
                      </h3>
                      <button onClick={() => handleDeleteRoom(room.id, room.name)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                    </div>

                    {Object.keys(materialSummary).length > 0 && (
                        <div className="p-4 border-b border-slate-100 bg-white">
                            <p className="text-[13px] font-bold text-slate-800 mb-2">Tóm tắt vật liệu:</p>
                            <ul className="text-[13px] text-slate-600 space-y-1">
                                {Object.keys(materialSummary).map((mat, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                        <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                                        <span className="font-semibold">{mat}:</span> 
                                        {materialSummary[mat].chuaNhan} chưa nhận, {materialSummary[mat].dangLam} đang làm, {materialSummary[mat].daCat} đã cắt
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="p-4 space-y-4 flex-1 bg-slate-50/50">
                      {roomTasks.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-8">Chưa có danh mục nào.</p>
                      ) : (
                        roomTasks.map(task => {
                          const fileUrl = getFileUrl(task.filePath);
                          const isImg = isImageFile(task.filePath);

                          return (
                          <div key={task.id} className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all shadow-sm group/task">
                            
                            {task.filePath ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-16 h-16 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-blue-500 shrink-0 border border-slate-200 hover:border-blue-400 hover:shadow-md transition overflow-hidden group">
                                  {isImg ? (
                                      <img src={fileUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                  ) : (
                                      <>
                                          <Download size={20} className="mb-1 text-blue-500 group-hover:-translate-y-1 transition-transform"/>
                                          <span className="text-[9px] font-bold text-center leading-tight">Tải File<br/>Về Máy</span>
                                      </>
                                  )}
                                </a>
                            ) : (
                                <div className="w-16 h-16 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-300 shrink-0 border border-dashed border-slate-200">
                                  <Image size={20} className="mb-1"/>
                                  <span className="text-[9px] font-medium text-center leading-tight">Chưa có<br/>file</span>
                                </div>
                            )}
                            
                            <div className="min-w-0 flex-1">
                              {editingTask?.id === task.id ? (
                                  <div className="bg-slate-50 p-3 rounded-lg border border-blue-200 mb-3 space-y-2 shadow-inner">
                                      <p className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1"><Edit size={12}/> Sửa thông tin</p>
                                      
                                      <input 
                                          value={editingTask.material || ''} 
                                          onChange={e => setEditingTask({...editingTask, material: e.target.value})} 
                                          className="w-full text-sm p-2 border border-slate-200 rounded outline-none focus:border-blue-400" 
                                          placeholder="Vật liệu..."
                                      />
                                      <input 
                                          value={editingTask.title || ''} 
                                          onChange={e => setEditingTask({...editingTask, title: e.target.value})} 
                                          className="w-full text-sm p-2 border border-slate-200 rounded outline-none focus:border-blue-400" 
                                          placeholder="Tên vách/tấm..."
                                      />
                                      
                                      <div className="mt-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase">Cập nhật File (Tùy chọn)</label>
                                        <input 
                                            type="file" 
                                            onChange={e => setEditFile(e.target.files[0])} 
                                            className="w-full mt-1 text-sm p-1 border border-slate-200 rounded outline-none focus:border-blue-400 bg-white file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" 
                                        />
                                        {editFile ? (
                                            <p className="text-[10px] text-green-600 font-bold mt-1">✓ Đã chọn file mới: {editFile.name}</p>
                                        ) : (
                                            <p className="text-[10px] text-slate-400 italic mt-1">Bỏ trống nếu giữ nguyên file cũ.</p>
                                        )}
                                      </div>

                                      <div className="flex gap-2 pt-2">
                                          <button onClick={handleSaveEdit} className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-[11px] font-bold hover:bg-blue-700 shadow-sm">Lưu thay đổi</button>
                                          <button onClick={() => { setEditingTask(null); setEditFile(null); }} className="bg-slate-200 text-slate-600 px-4 py-1.5 rounded-md text-[11px] font-bold hover:bg-slate-300">Hủy</button>
                                      </div>
                                  </div>
                              ) : (
                                  <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-bold text-[15px] text-blue-700 truncate pr-2">
                                        {task.material} - {task.title}
                                      </h4>
                                      <div className="flex gap-1.5 shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                          <button onClick={() => { setEditingTask(task); setEditFile(null); }} title="Sửa thông tin" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"><Edit size={14}/></button>
                                          <button onClick={() => handleDeleteTask(task.id)} title="Xóa danh mục" className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"><Trash2 size={14}/></button>
                                      </div>
                                  </div>
                              )}
                              
                              <div className="text-[12px] text-slate-600 space-y-1 mb-3">
                                <p>
                                    <span className="font-medium text-slate-500">File: </span> 
                                    {task.filePath ? (
                                        <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">
                                            {formatFileName(task.filePath)}
                                        </a>
                                    ) : <span className="text-red-400 italic">Chưa có file</span>}
                                </p>
                                <p><span className="font-medium text-slate-500">Người giao:</span> {currentAdminName}</p>
                                <p><span className="font-medium text-slate-500">Giao lúc:</span> {formatDateTime(task.createdAt)}</p>
                                
                                {task.userId && (
                                    <>
                                        <p><span className="font-medium text-slate-500">Người nhận:</span> <span className="font-semibold text-slate-800">{task.user?.fullName}</span></p>
                                        <p><span className="font-medium text-slate-500">Nhận lúc:</span> {formatDateTime(task.updatedAt)}</p>
                                    </>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mb-3">
                                  {task.status === 'DONE' ? (
                                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold">Xong</span>
                                  ) : task.userId ? (
                                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[11px] font-bold">Đang làm</span>
                                  ) : (
                                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[11px] font-bold">Chưa nhận</span>
                                  )}
                              </div>

                              <div className="border-t border-slate-100 pt-3">
                                <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                                  {task.notes && task.notes.map(n => {
                                      const isAdmin = !n.userId;
                                      const senderName = isAdmin ? currentAdminName : n.user?.fullName;
                                      return (
                                        <div key={n.id} className="text-[12px]">
                                            <span className={`font-bold ${isAdmin ? 'text-red-600' : 'text-blue-600'}`}>{senderName}: </span>
                                            <span className="text-slate-700">{n.content}</span>
                                        </div>
                                      )
                                  })}
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Nhập ghi chú và nhấn Enter..." 
                                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] outline-none focus:border-blue-400 bg-slate-50"
                                  onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                          if (e.nativeEvent.isComposing) return; // CHỐNG DUP CHỮ DO BỘ GÕ
                                          e.preventDefault();
                                          
                                          const val = e.target.value;
                                          if (!val.trim()) return;

                                          // LƯU LẠI GIÁ TRỊ VÀ XÓA LUÔN Ô INPUT ĐỂ CHẶN ENTER LẦN 2
                                          const contentToSend = val;
                                          e.target.value = ''; 

                                          try {
                                              const res = await fetch(`/api/tasks/${task.id}/notes`, {
                                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ content: contentToSend })
                                              });
                                              if (res.ok) { 
                                                  fetchData(); 
                                              } else {
                                                  // Lỗi mạng thì trả lại chữ để người ta khỏi mất công gõ lại
                                                  e.target.value = contentToSend;
                                              }
                                          } catch (error) { 
                                              e.target.value = contentToSend;
                                              alert("Lỗi gửi ghi chú!"); 
                                          }
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
        
        <div className="mt-8 text-center text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1">
          <span>© {new Date().getFullYear()} Workspace Management.</span>
          <span>Crafted with <span className="text-red-500">❤️</span> by</span>
          <span className="font-bold text-slate-600 hover:text-blue-600 cursor-pointer transition-colors">
            Hoàng Phúc (Sol)
          </span>
        </div>

      </div> 
    </div> 
  );
}