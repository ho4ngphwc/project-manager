require('dotenv').config();
const express = require('express'); 
const cors = require('cors'); 
const path = require('path'); 

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes'); 

const app = express();

// Middleware 
app.use(cors());
app.use(express.json()); 

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', authRoutes); // tạo ra /api/login
app.use('/api/users', userRoutes); // tạo ra /api/users/create, /api/user/employees,...
app.use('/api/projects', projectRoutes); // tạo ra /api/projects
app.use('/api/tasks', taskRoutes); // tạo ra /api/tasks 

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
    console.log(`Các API đã được nạp thành công!`);
});