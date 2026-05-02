import React, { useState, useEffect } from 'react';
import EmployeeWorkspace from './EmployeeWorkspace';

export default function EmployeeDashboard({ currentUser }) {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // --- 1. HÀM LẤY DỮ LIỆU TỪ SERVER ---
  const fetchData = async () => {
    try {
      const options = { 
        cache: 'no-store',
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
      };

      const [resProjects, resTasks] = await Promise.all([
        fetch('/api/projects', options),
        fetch('/api/tasks', options)
      ]);
      
      const dataProjects = await resProjects.json();
      const dataTasks = await resTasks.json();

      // Chỉ lọc những dự án mà nhân viên này tham gia
      const myProjects = dataProjects.filter(project => {
          const members = project.members || [];
          return members.some(member => member.id === parseInt(currentUser?.id));
      });

      setProjects(myProjects);
      setTasks(dataTasks);

    } catch (error) {
      console.error("Lỗi tải dữ liệu:", error);
    }
  };

  // --- 2. THIẾT LẬP CHẾ ĐỘ CẬP NHẬT TỰ ĐỘNG (POLLING) ---
  useEffect(() => {
    fetchData(); // Chạy lần đầu ngay khi vào trang

    const interval = setInterval(() => {
      fetchData();
    }, 3000); // 3 giây cập nhật 1 lần

    return () => clearInterval(interval); // Dọn dẹp khi thoát
  }, []);

  // --- 3. LOGIC QUAN TRỌNG: LUÔN LẤY DỮ LIỆU DỰ ÁN MỚI NHẤT ---
  // Thay vì dùng cái selectedProject cũ (bị đứng yên), ta tìm nó trong danh sách projects vừa fetch về
  const activeProject = projects.find(p => p.id === selectedProject?.id);

  // Nếu đang ở trong một dự án cụ thể
  if (selectedProject) {
    return (
      <EmployeeWorkspace 
        // Ưu tiên dùng activeProject (đã có phòng mới), nếu chưa tìm thấy thì dùng selectedProject tạm
        project={activeProject || selectedProject}
        tasks={tasks}
        fetchData={fetchData}
        onBack={() => setSelectedProject(null)} 
        currentUser={currentUser} 
      />
    );
  }

  // --- 4. GIAO DIỆN DANH SÁCH DỰ ÁN NGOÀI DASHBOARD ---
  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <span>👷</span> Việc của tôi
      </h2>
      
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
           <p className="text-slate-500 font-medium">Hiện tại sếp chưa thêm bạn vào dự án nào cả.</p>
           <p className="text-slate-400 text-sm mt-2">Vui lòng liên hệ Admin để được cấp quyền nhé!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(p => {
            // Đếm số việc chưa ai nhận trong dự án
            const newTasksCount = tasks.filter(t => t.projectId === p.id && !t.userId).length;

            return (
              <div 
                  key={p.id} 
                  onClick={() => setSelectedProject(p)}
                  className="relative bg-white border-2 border-slate-100 rounded-2xl p-6 shadow-sm hover:border-orange-400 hover:shadow-md transition cursor-pointer group"
              >
                {/* Thông báo số việc mới (Badge đỏ) */}
                {newTasksCount > 0 && (
                    <div className="absolute -top-3 -right-3 flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex items-center justify-center rounded-full h-8 w-8 bg-red-500 text-white text-[13px] font-black border-2 border-white shadow-md">
                            {newTasksCount}
                        </span>
                    </div>
                )}

                <h3 className="text-lg font-black text-slate-800 group-hover:text-orange-600 transition">{p.name}</h3>
                <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.status === 'Đã hoàn thành' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                    Trạng thái: {p.status || 'Đang làm'}
                </p>
                
                <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
                    {newTasksCount > 0 ? (
                        <span className="text-xs font-bold text-red-500 uppercase animate-pulse">Có {newTasksCount} việc đang chờ!</span>
                    ) : (
                        <span className="text-xs font-bold text-slate-400 uppercase">Click để xem bản vẽ</span>
                    )}
                    
                    <button className="text-sm font-bold text-orange-500 group-hover:translate-x-1 transition-transform">
                      Vào xưởng &rarr;
                    </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}