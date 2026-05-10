import React, { useState, useEffect } from 'react';
import AdminOverview from './AdminOverview';
import AdminWorkspace from './AdminWorkspace';

export default function AdminDashboard() {
    const [employees, setEmployees ] = useState([]); 
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [activeProject, setActiveProject] = useState(null); 

    const fetchData = async () => {
        try {
            // TẠO LỆNH ÉP TRÌNH DUYỆT KHÔNG ĐƯỢC LƯU CACHE
            const options = { 
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            };

            const [resEmp, resProj, resTask] = await Promise.all([
                fetch('/api/users/employee', options),
                fetch('/api/projects', options),
                fetch('/api/tasks', options)
            ]);
            
            setEmployees(await resEmp.json());
            setProjects(await resProj.json());
            setTasks(await resTask.json());
        }
        catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
        }
    };

    useEffect(() => {
        const handleGoHome = () => {
            setActiveProject(null);
        };

        window.addEventListener('goHome', handleGoHome);

        return () => {
            window.removeEventListener('goHome', handleGoHome);
        };
    }, []);

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData();
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Nếu có project đang được chọn -> mở component AdminWorkspace 
    if (activeProject) {
        const latestProjectData = projects.find(p => p.id === activeProject.id) || activeProject;
        
        return (
            <AdminWorkspace
                project={latestProjectData}
                tasks={tasks}
                employees={employees}
                fetchData={fetchData}
                onBack={() => setActiveProject(null)}
            />
        );
    }

    // Nếu ko có chọn project nào -> Mở component AdminOverview
    return (
        <AdminOverview
            projects={projects}
            tasks={tasks}
            employees={employees}
            fetchData={fetchData}
            onOpenProject={(project) => setActiveProject(project)}
        />
    );
}