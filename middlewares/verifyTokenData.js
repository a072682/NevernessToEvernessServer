const jwt = require('jsonwebtoken');

// 驗證 JWT middleware
const verifyTokenData = (req, res, next) => {
    try {
        // 從 Authorization header 取得 token
        // 格式：Authorization: Bearer xxxxx
        const authHeader = req.headers.authorization;

        if (!authHeader) {
        return res.status(401).json({ message: '未提供 token' });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
        return res.status(401).json({ message: 'token 格式錯誤' });
        }

        // 驗證 token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 把解碼後的使用者資料存進 req
        req.user = decoded;

        // 執行下一個
        next();

    } catch (error) {
        console.error(error);
        return res.status(401).json({ message: 'token 驗證失敗' });
    }
};

module.exports = verifyTokenData;
