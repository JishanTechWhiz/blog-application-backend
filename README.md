# 📝 Blog Application Backend

This is a **RESTful Blog API** built using **Node.js**, **Express**, **Sequelize**, and **MySQL**, featuring JWT-based authentication, role-based access, Swagger API documentation, and modular route/controller structure. It supports **user registration/login**, **blog post CRUD**, **comments**, and **categories**, with complete **unit/integration tests**.

---

## 🚀 Features

- ✅ JWT Authentication
- ✅ API Key Security (`x-api-key`)
- ✅ RESTful Routing (Modular Structure)
- ✅ Sequelize ORM for MySQL
- ✅ Joi-based Request Validation
- ✅ Swagger API Docs (`/api-docs`)
- ✅ Unit and Integration Tests (Jest + Supertest)

---

## 🗃️ Database Schema

Database: `db_blog_application`

Tables:

- `tbl_user`
- `tbl_post`
- `tbl_comment`
- `tbl_category`

Use this SQL to create your database:

```sql
CREATE DATABASE IF NOT EXISTS db_blog_application;
USE db_blog_application;


<---------------------------------------------------------->
📁 Project Structure



project-root/
├── index.js                  # Main app entry
├── swagger.js              # Swagger configuration
├── .env                    # Environment variables
├── /config/                # DB & config setup
├── /models/                # Sequelize models
├── /modules/v1/            # Versioned APIs
│   ├── user/
│   ├── post/
│   ├── comment/
│   └── category/
├── /middleware/            # Auth, API key middleware
├── /validators/            # Joi schemas
├── /helpers/               # Utility functions
├── /tests/                 # Unit & Integration tests
│   ├── unit/
│   └── integration/
└── package.json




<---------------------------------------------------------->
⚙️ Installation & Setup

1. Clone the Repository:
git clone https://github.com/your-username/blog_application_backend.git
cd blog_application_backend

2. Install Dependencies:
npm install

3. Configure Environment Variables:

Create a .env file:
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=db_blog_application
JWT_SECRET=your_jwt_secret
API_KEY=MyBlogAPIProject

4. Run the Application:

npm start
Visit: http://localhost:5000



<---------------------------------------------------------->
📖 Swagger API Docs
Access the Swagger UI for all API documentation:

http://localhost:5000/api-docs

✅ Supports both x-api-key and Authorization: Bearer <JWT> headers.



<---------------------------------------------------------->
🧪 Running Tests

Unit Tests:

npm run test:user-unit
npm run test:post-unit
npm run test:comment-unit


Integration Tests:

npm run test:user-integration
npm run test:post-integration
npm run test:comment-integration



<---------------------------------------------------------->
📂 Modules
🔐 User Module
- Register, Login (email/social)
- Profile management
- JWT + API Key Auth


📝 Post Module
- CRUD: Create, List, Update, Delete
- Filter by author or category

💬 Comment Module
- Add/View/Delete comments on posts

📚 Category Module
- Manage blog post categories

🛡️ Security
- JWT for authenticated routes
- API Key required for all requests (x-api-key)
- Input validation using Joi

