
const pool = require("../../db/db");
//讀取資料庫連接設定
const bcrypt = require('bcrypt');
//密碼加密套件
const jwt = require('jsonwebtoken');
//產生token套件

//新增會員
exports.registerUser = async (req, res) => {
    //先進行解構
    const { email, password } = req.body;

    //如果沒有信箱或密碼則回報錯誤
    if (!email || !password) {
      return res.status(400).json({ message: 'email 與 password 必填' });
    }

    //密碼加密（建議難度 10）
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        //檢查是否已註冊
        const existing = await pool.query(
            `
                SELECT id
                FROM users 
                WHERE email = $1
            `, 
            [email]
        );
        //如果有資料則回報訊息
        if (existing.rowCount !== 0) {
            return res.status(400).json({ error: '此信箱已註冊' });
        }

        const result = await pool.query(
            `
            INSERT INTO users (email, password, auth_provider)
            VALUES ($1, $2, 'local')
            RETURNING id, email, auth_provider, created_at
            ` ,
            [email, hashedPassword]
        );

        return res.status(201).json({
            message: '註冊成功',
            user: result.rows[0],
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

// 登入會員
exports.loginUser = async (req, res) => {
    //資料解構
    const { name, password } = req.body;

    // 基本檢查
    if (!name || !password) {
        return res.status(400).json({ message: 'name 與 password 必填' });
    }

    try {
        // 查詢信箱
        const result = await pool.query(
            `
            SELECT id, name, email, password, role
            FROM users
            WHERE name = $1
            `,
            [name]
        );

        // 會員不存在則回報錯誤
        if (result.rowCount === 0) {
            return res.status(401).json({ message: '帳號或密碼錯誤' });
        }

        //密碼錯誤則回報錯誤
        if(password !== result.rows[0].password){
            return res.status(401).json({ message: '密碼錯誤' });
        }

        //會員資料
        const admin = result.rows[0];

        // 產生 JWT（Token）
        const token = jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h', // Token 有效時間
            }
        );

        // 回傳 token
        return res.status(200).json({
            message: '登入成功',
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: '伺服器錯誤' });
    }
};

//登入確認
exports.logInCheck = (req, res) => {
    res.json(
        {  
        message: '確認成功',
        status: 
            { 
                userId: req.user.id,
                email: req.user.email,
                role: req.user.role,
                auth_provider:req.user.auth_provider
            },
        }
    );
};

//登出
exports.logout = (req, res) => {
    res.json({ message: '登出成功' });
};