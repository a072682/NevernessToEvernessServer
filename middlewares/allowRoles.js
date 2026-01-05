//確認登入者的狀態來給予權限
// 權限驗證 middleware
const allowRoles = (...roles) => {
    return (req, res, next) => {

        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: '尚未驗證身分',user:req.user });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: '權限不足' });
        }
        next();
    };
};

module.exports = allowRoles;