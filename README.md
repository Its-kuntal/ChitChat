# 💬 Real-Time Chat App with Socket.IO

A secure and scalable **real-time chat platform** built with **Node.js, Express, Socket.IO, MongoDB, and Tailwind CSS**.
This app allows users to chat in **public rooms**, **private messages**, and **group chats**, with chat history stored in MongoDB.

---

## 🚀 Features

* 🔑 **Authentication** with sessions/JWT
* 💬 **Real-time messaging** with Socket.IO
* 👥 **User groups & private chats**
* 📜 **Persistent chat history** stored in MongoDB
* ✍️ **Typing indicators** & 🟢 **online status**
* 🎨 **Responsive UI** styled with Tailwind CSS & EJS templates

---

## 🛠️ Tech Stack

* **Backend:** Node.js, Express
* **Real-time:** Socket.IO
* **Database:** MongoDB
* **Frontend:** EJS, Tailwind CSS

---

## 📂 Project Structure

```
├── config/
│   └── db.js                # Database connection
├── controllers/             # Request handlers
│   ├── chatController.js
│   ├── roomController.js
│   └── userController.js
├── middleware/
│   └── authMiddleware.js    # Authentication middleware
├── models/                  # Mongoose models
│   ├── messageModel.js
│   ├── roomModel.js
│   └── userModel.js
├── routes/                  # Application routes
│   ├── chatRoutes.js
│   ├── roomRoutes.js
│   └── userRoutes.js
├── views/                   # EJS templates
│   ├── partials/
│   │   └── header.ejs
│   ├── chat.ejs
│   ├── index.ejs
│   └── register.ejs
├── public/                  # Static assets
│   ├── css/
│   │   ├── animations.css
│   │   ├── input.css
│   │   └── style.css
│   └── js/
│       └── modules/
│           ├── main-new.js
│           ├── main-simple.js
│           └── main.js
├── server.js                # Entry point
├── tailwind.config.js       # Tailwind setup
├── package.json
├── package-lock.json
└── .env
```

---

## ⚙️ Installation & Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/yourusername/realtime-chat-app.git
   cd realtime-chat-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<your-db-url>
   JWT_SECRET=your_secret_key
   ```

4. **Run the app**

   ```bash
   npm run dev
   ```

   App will be available at: **[http://localhost:5000](http://localhost:5000)**

---

## 📖 Mini Guide

* **Authentication:** Implemented using sessions/JWT for secure access.
* **Messaging:** Socket.IO handles broadcasting messages in rooms and private chats.
* **Groups & Private Chats:** Users can create rooms and chat 1:1.
* **Chat History:** Stored and retrieved from MongoDB.
* **Typing Indicators & Online Status:** Socket.IO events track user activity.

---

## 📌 Deliverables

* ✅ Real-time chat with **rooms & private messages**
* ✅ **Persistent chat history** with MongoDB
* ✅ **Scalable & secure architecture** for production use

---

## 🖼️ Screenshots / Demo


<img width="1912" height="878" alt="image" src="https://github.com/user-attachments/assets/a4f5418e-c700-4786-8644-205079ea3b15" />


<img width="1890" height="876" alt="image" src="https://github.com/user-attachments/assets/3b79f36b-243f-4678-ba07-b305f1fc361b" />




<img width="1841" height="873" alt="image" src="https://github.com/user-attachments/assets/4ebf13e3-fbb1-4714-9fc2-f4dc26dfe09d" />


<img width="1899" height="877" alt="image" src="https://github.com/user-attachments/assets/bf5da3e0-97a8-40fd-b2ea-aa6d59de1463" />




---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Added feature'`)
4. Push and create a PR

---

## 📜 License

This project is licensed under the **MIT License**.
