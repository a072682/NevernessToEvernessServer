const pool = require("../../db/db");
// 讀取資料庫連線設定

// 取得所有預約資料
exports.getAllGameReservations = async (req, res) => {
    try {
        const result = await pool.query(
            `
                SELECT *
                FROM game_reservations
                ORDER BY created_at DESC
            `
        );

        return res.status(200).json({
            message: "取得預約資料成功",
            success: true,
            data: result.rows,
        });

    } catch (error) {
        console.error("取得預約資料失敗:", error);
        return res.status(500).json({
            success: false,
            message: "取得預約資料失敗",
        });
    }
};
// 取得所有預約資料

// 取得單一預約資料
exports.getSingleGameReservation = async (req, res) => {
    const { id } = req.params;

    // 基本檢查
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "缺少預約 id",
        });
    }

    try {
        const result = await pool.query(
            `
                SELECT *
                FROM game_reservations
                WHERE id = $1
            `,
            [id]
        );

        // 找不到資料
        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "找不到此預約資料",
            });
        }

        return res.status(200).json({
            success: true,
            data: result.rows[0],
        });

    } catch (error) {
        console.error("取得單一預約失敗:", error);
        return res.status(500).json({
            success: false,
            message: "取得單一預約失敗",
        });
    }
};
// 取得單一預約資料

// 新增遊戲預約
exports.createGameReservation = async (req, res) => {

    //解構資料
    //region_code 電話區碼
    //phone_number 電話號碼
    //platforms 登陸主機
    const { region_code, phone_number, platforms, agree_terms } = req.body;

    // 基本驗證
    if (!region_code || !phone_number || !platforms) {
        return res.status(400).json({
            success: false,
            message: "缺少必要欄位",
        });
    }

    // 必須同意條款
    if (agree_terms !== true) {
        return res.status(400).json({
            success: false,
            message: "必須同意條款",
        });
    }

    try {

        // 驗證是否有預約
        const existing = await pool.query(
            `
                SELECT 1
                FROM game_reservations
                WHERE region_code = $1 AND phone_number = $2
            `,
            [region_code, phone_number]
        );

        //如果數值大於0代表有預約過
        if (existing.rowCount > 0) {
            return res.status(409).json({
                success: false,
                message: "此手機號碼已預約過",
            });
        }

        const result = await pool.query(
            `
                INSERT INTO game_reservations
                (region_code, phone_number, platforms, agree_terms)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `,
            [region_code, phone_number, platforms, agree_terms]
        );

        return res.status(201).json({
            success: true,
            message: "預約成功",
            data: result.rows[0],
        });

    } catch (error) {

        // UNIQUE(region_code, phone_number) 衝突
        if (error.code === "23505") {
            return res.status(409).json({
                success: false,
                message: "此手機號碼已預約過",
            });
        }

        console.error("新增預約失敗:", error);

        return res.status(500).json({
            success: false,
            message: "新增預約失敗",
        });
    }
};
// 新增遊戲預約

// 修改預約資料（只允許改 platforms）
exports.updateGameReservation = async (req, res) => {

    const { id } = req.params;
    const { platforms } = req.body;

    // 基本檢查
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "缺少預約 id",
        });
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({
            success: false,
            message: "platforms 必須為非空陣列",
        });
    }

    try {

        // 先確認資料是否存在
        const existing = await pool.query(
            `
                SELECT id
                FROM game_reservations
                WHERE id = $1
            `,
            [id]
        );

        if (existing.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "找不到此預約資料",
            });
        }

        const result = await pool.query(
            `
                UPDATE game_reservations
                SET platforms = $1
                WHERE id = $2
                RETURNING *
            `,
            [platforms, id]
        );

        return res.status(200).json({
            success: true,
            message: "預約資料更新成功",
            data: result.rows[0],
        });

    } catch (error) {
        console.error("更新預約資料失敗:", error);

        return res.status(500).json({
            success: false,
            message: "更新預約資料失敗",
        });
    }
};
// 修改預約資料

// 刪除預約資料
exports.deleteGameReservation = async (req, res) => {

    const { id } = req.params;

    // 基本檢查
    if (!id) {
        return res.status(400).json({
            success: false,
            message: "缺少預約 id",
        });
    }

    try {
        // 先確認資料是否存在
        const existing = await pool.query(
            `
                SELECT id
                FROM game_reservations
                WHERE id = $1
            `,
            [id]
        );

        if (existing.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "找不到此預約資料",
            });
        }

        // 確認存在後才刪除
        await pool.query(
            `
                DELETE FROM game_reservations
                WHERE id = $1
            `,
            [id]
        );

        return res.status(200).json({
            success: true,
            message: "預約資料已刪除",
        });

    } catch (error) {
        console.error("刪除預約資料失敗:", error);

        return res.status(500).json({
            success: false,
            message: "刪除預約資料失敗",
        });
    }
};
// 刪除預約資料