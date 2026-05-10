import React, { useState, useEffect } from 'react';
import EmployeeWorkspace from './EmployeeWorkspace';
import { Bell } from 'lucide-react'; 

export default function EmployeeDashboard({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const fetchData = async () => {
    try {
      const options = { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } };
      const [resProjects, resTasks] = await Promise.all([
        fetch('/api/projects', options), fetch('/api/tasks', options)
      ]);
      const dataProjects = await resProjects.json();
      const dataTasks = await resTasks.json();

      const myProjects = dataProjects.filter(project => {
          const members = project.members || [];
          return members.some(member => member.id === parseInt(currentUser?.id));
      });
      setProjects(myProjects);
      setTasks(dataTasks);
    } catch (error) { console.error("Lỗi tải dữ liệu:", error); }
  };

  useEffect(() => {
    const handleGoHome = () => setSelectedProject(null);
    window.addEventListener('goHome', handleGoHome);
    return () => window.removeEventListener('goHome', handleGoHome);
  }, []);

  useEffect(() => {
    fetchData(); 
    const interval = setInterval(() => fetchData(), 3000); 
    return () => clearInterval(interval); 
  }, []);

  const activeProject = projects.find(p => p.id === selectedProject?.id);

  if (selectedProject) {
    return (
      <EmployeeWorkspace 
        project={activeProject || selectedProject} tasks={tasks}
        fetchData={fetchData} onBack={() => setSelectedProject(null)} currentUser={currentUser} 
      />
    );
  }

  // --- HÀM LOGIC THÔNG MINH: KIỂM TRA TIN NHẮN CHƯA ĐỌC CỦA SẾP ---
  const checkUnreadAdminNote = (task, currentUserId) => {
      // 1. Nếu việc này ĐÃ CÓ NGƯỜI NHẬN, và người đó KHÔNG PHẢI MÌNH -> Bỏ qua, không báo chuông
      if (task.userId && task.userId !== parseInt(currentUserId)) return false;
      
      // 2. Nếu không có ghi chú nào -> Bỏ qua
      if (!task.notes || task.notes.length === 0) return false;
      
      // 3. Lấy tin nhắn CUỐI CÙNG trong danh sách
      const lastNote = task.notes[task.notes.length - 1];
      
      // 4. Chuông chỉ kêu nếu tin nhắn cuối cùng là của Sếp (không có userId)
      return !lastNote.userId;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>👷</span> Việc của tôi
      </h2>
      
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
           <p className="text-slate-500 font-medium">Hiện tại sếp chưa thêm bạn vào dự án nào cả.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => {
            const newTasksCount = tasks.filter(t => t.projectId === p.id && !t.userId).length;
            
            // DÙNG HÀM LOGIC MỚI ĐỂ ĐẾM SỐ LƯỢNG THÔNG BÁO CẦN XỬ LÝ
            const unreadNotesCount = tasks.filter(t => t.projectId === p.id && checkUnreadAdminNote(t, currentUser?.id)).length;

            return (
              <div 
                  key={p.id} 
                  onClick={() => setSelectedProject(p)}
                  className="relative bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:border-orange-400 hover:shadow-md transition cursor-pointer group flex flex-col justify-between"
              >
                {newTasksCount > 0 && (
                    <div className="absolute -top-3 -right-3 flex items-center justify-center z-10">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-8 w-8 bg-red-500 text-white text-[13px] font-black border-2 border-white shadow-md">
                            {newTasksCount}
                        </span>
                    </div>
                )}

                <div>
                    <h3 className="text-lg font-black text-slate-800 group-hover:text-orange-600 transition pr-2">{p.name}</h3>
                    <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${p.status === 'Đã hoàn thành' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        Trạng thái: {p.status || 'Đang làm'}
                    </p>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex flex-col gap-2 mb-3">
                        {newTasksCount > 0 && (
                            <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 
                                CÓ {newTasksCount} VIỆC CHƯA NHẬN!
                            </span>
                        )}
                        
                        {/* THÔNG BÁO TIN NHẮN MỚI TỪ SẾP */}
                        {unreadNotesCount > 0 && (
                            <span className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1.5 bg-blue-50 w-fit px-2 py-1 rounded-md border border-blue-100">
                                <Bell size={14} className="animate-bounce"/> 
                                CÓ {unreadNotesCount} TIN NHẮN MỚI!
                            </span>
                        )}

                        {newTasksCount === 0 && unreadNotesCount === 0 && (
                            <span className="text-xs font-bold text-slate-400 uppercase">Click để xem chi tiết</span>
                        )}
                    </div>
                    
                    <div className="flex justify-end">
                        <button className="text-sm font-bold text-orange-500 group-hover:translate-x-1 transition-transform shrink-0">
                          Vào xưởng &rarr;
                        </button>
                    </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}