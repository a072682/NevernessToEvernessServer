// db/db.js
const { Pool } = require('pg'); // 引入 pg 套件，並從中取出 Pool（連線池）功能

//如果要上傳Vercel 以下內容要移除
//require('dotenv').config(); // 引入 dotenv 套件，讓我們可以讀取 .env 檔案中的環境變數
//如果要上傳Vercel 以上內容要移除

const pool = new Pool({ // 建立一個新的 Pool 實例，裡面傳入連線設定
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    //如果要上傳Vercel 新增以下內容
    ssl: {
        rejectUnauthorized: false, // 雲端 PostgreSQL
    },
    //如果要上傳Vercel 新增以上內容
});

module.exports = pool; // 將這個 pool 導出（export），讓其他檔案可以使用