const express = require('express');// 載入 express 套件，建立後端伺服器框架
const app = express();// 使用 express() 建立一個應用程式實例
const pool = require('./db/db');// 載入我們自己寫的資料庫連線模組（也就是 db.js）
const cors = require('cors');//匯入中介層套件工具
const cookieParser = require('cookie-parser');//將 Cookie 字串轉換成token讓後端可以讀取
require('dotenv').config();// 載入 dotenv 以支援 .env 環境變數

app.use(express.json());// 解析 JSON 格式的 request body

app.use(cookieParser());// 將 Cookie 字串轉換成token讓後端可以讀取

//const userRoutes = require('./routes/user/userRoutes'); 
//會員相關用api

const authRoutes = require('./routes/auth/authRoutes'); 
//引入登入相關router

const articlesRoutes = require('./routes/articles/articlesRoutes');
//引入文章router檔案

const gameReservationRoutes = require('./routes/gameReservation/gameReservationRoutes');
//引入登陸router檔案

const imagesRoutes = require('./routes/images/imagesRoutes');
// 引入上傳圖片路由

//中介層設定
app.use(cors({
    origin: '*', // 允許的前端來源
    // methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], // 可允許的方法
    //credentials: true,
}));
//中介層設定

//測試資料庫連線的路由
app.get('/test-db', async (req, res) => {
    // 這個函式只會在使用者訪問 http://localhost:5100/test-db 時執行
    try {
        const result = await pool.query('SELECT NOW()');
        // 用 pool 發送 SQL 指令：取得目前資料庫時間
        res.json({ message: '連線成功', time: result.rows[0] });
        // 回傳 JSON 結果給使用者
    } catch (err) {
        console.error(err);
        res.status(500).send('連線失敗');
        // 若有錯誤，顯示在後端並告知前端
        //res表示伺服器要回傳給使用者的內容
        //.status(500)設定狀態碼為 500（伺服器錯誤）
        //傳送純文字 "連線失敗" 作為回應內容
    }
});

//#region 登入相關API
app.use('/auth', authRoutes);
//#endregion

//#region 文章系統相關路由
app.use('/articles', articlesRoutes);
//#endregion

//#region 登陸系統相關路由
app.use('/reservation', gameReservationRoutes);
//#endregion

//#region 圖片系統相關路由
app.use('/images', imagesRoutes);
//#endregion

// 啟動伺服器 
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`伺服器啟動`,PORT);
});