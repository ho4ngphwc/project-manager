import React, { useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, MessageSquare, Image as ImageIcon, Download, HandMetal, CheckSquare, XCircle, RotateCcw } from 'lucide-react';

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
        return `/${cleanPath.substring(uploadsIndex)}`; 
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

export default function EmployeeWorkspace({ project, tasks, fetchData, onBack, currentUser }) {
  const rooms = project?.rooms || [];
  const projectTasks = tasks?.filter(t => t.projectId === project?.id) || [];

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (fetchData) {
        fetchData();
      }
    }, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const handleAcceptTask = async (taskId) => {
      if (!currentUser?.id) return alert("Lỗi: Không tìm thấy thông tin đăng nhập!");
      try {
          const res = await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  userId: parseInt(currentUser.id), 
                  isAccepted: true,
                  status: 'DOING'
              })
          });
          if (res.ok) fetchData();
          else alert("Có lỗi xảy ra khi nhận việc!");
      } catch (error) { alert("Lỗi kết nối máy chủ!"); }
  };

  const handleCancelAccept = async (taskId) => {
      if (!window.confirm("Bạn có chắc muốn nhả việc này ra không?")) return;
      try {
          const res = await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  userId: null, 
                  isAccepted: false,
                  status: 'TODO' 
              })
          });
          if (res.ok) fetchData();
          else alert("Có lỗi xảy ra khi hủy nhận việc!");
      } catch (error) { alert("Lỗi kết nối máy chủ!"); }
  };

  const handleCompleteTask = async (taskId) => {
      if (!window.confirm("Bạn chắc chắn đã cắt xong rồi chứ?")) return;
      try {
          const res = await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'DONE' })
          });
          if (res.ok) fetchData();
          else alert("Có lỗi xảy ra khi xác nhận!");
      } catch (error) { alert("Lỗi kết nối máy chủ!"); }
  };

  const handleUndoComplete = async (taskId) => {
      if (!window.confirm("Đánh dấu lại là chưa cắt xong?")) return;
      try {
          const res = await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'DOING' }) 
          });
          if (res.ok) fetchData();
          else alert("Có lỗi xảy ra khi hoàn tác!");
      } catch (error) { alert("Lỗi kết nối máy chủ!"); }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen -m-6 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition shadow-sm">
          <ArrowLeft size={18} /> Quay lại
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center text-white border-b-4 border-orange-500">
          <div>
            <h2 className="text-2xl font-bold uppercase">{project?.name || 'Chưa tải dự án'}</h2>
            <p className="text-slate-300 text-sm mt-1 flex items-center gap-1">
              Hồ bơi việc làm - Rảnh tay là bấm nhận!
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-50">
          {rooms.length === 0 ? (
            <div className="text-center py-20">
               <p className="text-slate-500 font-medium">Sếp chưa tạo phòng nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {rooms.map(room => {
                const roomTasks = projectTasks.filter(t => t.roomId === room.id);
                return (
                  <div key={room.id} className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                    <div className="p-4 bg-white flex justify-between items-center border-b border-slate-200">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                        <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
                        {room.name}
                      </h3>
                      <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                          {roomTasks.length} mục
                      </span>
                    </div>

                    <div className="p-4 space-y-4 flex-1 bg-slate-50/50">
                      {roomTasks.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-8">Phòng này chưa có việc.</p>
                      ) : (
                        roomTasks.map(task => {
                          const fileUrl = getFileUrl(task.filePath);
                          const isImg = isImageFile(task.filePath);
                          const isMyTask = currentUser && task.userId === parseInt(currentUser.id);

                          return (
                          <div key={task.id} className={`flex gap-4 p-4 rounded-xl border transition-all shadow-sm ${
                              task.status === 'DONE' ? 'border-green-200 bg-green-50/30 opacity-70' :
                              isMyTask ? 'border-blue-300 bg-blue-50/30 shadow-md' : 
                              task.userId ? 'border-slate-200 bg-slate-100 opacity-60' : 
                              'border-orange-200 bg-white hover:border-orange-400' 
                          }`}>
                            
                            {task.filePath ? (
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="w-20 h-20 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-blue-500 shrink-0 border border-slate-200 overflow-hidden group">
                                  {isImg ? (
                                      <img src={fileUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                  ) : (
                                      <>
                                          <Download size={24} className="mb-1 text-blue-500"/>
                                          <span className="text-[10px] font-bold text-center leading-tight">Mở File</span>
                                      </>
                                  )}
                                </a>
                            ) : (
                                <div className="w-20 h-20 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-300 shrink-0 border border-dashed border-slate-200">
                                  <ImageIcon size={24} className="mb-1"/>
                                  <span className="text-[10px] font-medium text-center leading-tight">Chưa có<br/>file</span>
                                </div>
                            )}
                            
                            <div className="min-w-0 flex-1 flex flex-col justify-between">
                              <div>
                                  <h4 className={`font-bold text-[16px] truncate mb-1 ${task.status === 'DONE' ? 'text-green-700' : 'text-slate-800'}`}>
                                    {task.material} - {task.title}
                                  </h4>
                                  <div className="text-[12px] text-slate-600 space-y-0.5 mb-2">
                                    <p><span className="text-slate-400">File:</span> <span className="font-medium text-blue-600">{task.filePath ? formatFileName(task.filePath) : '---'}</span></p>
                                    <p><span className="text-slate-400">Giao lúc:</span> {formatDateTime(task.createdAt)}</p>
                                  </div>
                              </div>

                              <div className="mt-2">
                                  {task.status === 'DONE' ? (
                                      <div className="flex items-center gap-2">
                                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                              <CheckCircle size={16}/> Đã cắt xong
                                          </span>
                                          {isMyTask && (
                                              <button onClick={() => handleUndoComplete(task.id)} title="Hoàn tác (Đánh dấu chưa xong)" className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-100 rounded-md transition">
                                                  <RotateCcw size={16} />
                                              </button>
                                          )}
                                      </div>
                                  ) : !task.userId ? (
                                      <button onClick={() => handleAcceptTask(task.id)} className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 transition shadow-md shadow-orange-500/20 active:scale-95">
                                          <HandMetal size={18}/> Bấm Nhận Việc
                                      </button>
                                  ) : isMyTask ? (
                                      <div className="flex flex-col md:flex-row gap-2">
                                          <button onClick={() => handleCancelAccept(task.id)} className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition" title="Nhả việc lại cho người khác">
                                              <XCircle size={18}/> Hủy
                                          </button>
                                          <button onClick={() => handleCompleteTask(task.id)} className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition shadow-md shadow-green-600/20 active:scale-95 flex-1">
                                              <CheckSquare size={18}/> Xác nhận đã cắt
                                          </button>
                                      </div>
                                  ) : (
                                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-500 rounded-lg text-xs font-bold">
                                          🔒 {task.user?.fullName} đã nhận
                                      </div>
                                  )}
                              </div>

                              <div className="border-t border-slate-200 pt-3 mt-3">
                                <div className="space-y-2 mb-2 max-h-32 overflow-y-auto">
                                  {task.notes && task.notes.map(n => {
                                      const isAdmin = !n.userId;
                                      const senderName = isAdmin ? "Sếp Tâm" : n.user?.fullName;
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
                                  placeholder="Gõ báo cáo / hỏi sếp rồi nhấn Enter..." 
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 bg-white"
                                  onKeyDown={async (e) => {
                                      if (e.key === 'Enter') {
                                          if (e.nativeEvent.isComposing) return; // CHỐNG DUP CHỮ KHI GÕ TIẾNG VIỆT
                                          e.preventDefault();
                                          
                                          const val = e.target.value;
                                          if (!val.trim()) return;
                                          if (!currentUser?.id) return alert("Lỗi phiên đăng nhập, vui lòng tải lại trang!");
                                          try {
                                              const res = await fetch(`/api/tasks/${task.id}/notes`, {
                                                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                                                  body: JSON.stringify({ content: val, userId: parseInt(currentUser.id) })
                                              });
                                              if (res.ok) { e.target.value = ''; fetchData(); }
                                          } catch (error) { alert("Lỗi gửi ghi chú!"); }
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
        
        <div className="pb-6 text-center text-[11px] font-medium text-slate-400 flex items-center justify-center gap-1 bg-slate-50">
          <span>© {new Date().getFullYear()} Workspace Management.</span>
          <span>Crafted with <span className="text-red-500">❤️</span> by</span>
          <span className="font-bold text-slate-600 hover:text-orange-600 cursor-pointer transition-colors">
            Hoàng Phúc (Sol)
          </span>
        </div>

      </div>
    </div>
  );
}