const pool = require("../../db/db");
const cloudinary = require("../../utils/cloudinary");

//#region
//#endregion

//#region 取得所有文章
exports.getAllArticles = async (req, res) => {
    try {
        const result = await pool.query(
            `
                SELECT *
                FROM articles
                ORDER BY created_at DESC
            `
        );

        res.json({
        message: "文章列表取得成功",
        articles: result.rows,
        });

    } catch (err) {
        console.error("取得文章列表失敗:", err);
        res.status(500).json({ error: "伺服器錯誤" });
    }
};
//#endregion

//#region 取得單篇文章
exports.getSingleArticle = async (req, res) => {
    try {
        // 從網址取得 id
        const { id } = req.params;

        // 檢查 id 是否存在
        if (!id) {
        return res.status(400).json({ message: "請提供文章 ID" });
        }

        // 取得該文章
        const articleResult = await pool.query(
            `
                SELECT id, title, class, content, created_at
                FROM articles 
                WHERE id = $1
            `,
            [id]
        );

        // 如果找不到文章則回報錯誤
        if (articleResult.rows.length === 0) {
        return res.status(404).json({ message: "找不到此文章" });
        }

        // 取得該文章的圖片清單
        const articleImgIdListData = await pool.query(
        `SELECT cloud_id
        FROM images
        WHERE article_id = $1`,
        [id]
        );

        // 回傳文章
        res.json({
            article: {
                id: articleResult.rows[0].id,
                title: articleResult.rows[0].title,
                category: articleResult.rows[0].class,
                content: articleResult.rows[0].content,
                created_at: articleResult.rows[0].created_at,
            },
            imgIdListData: articleImgIdListData.rows,
        });

    } catch (err) {
        console.error("取得單篇文章失敗:", err);
        res.status(500).json({ error: "伺服器錯誤" });
    }
};
//#endregion

//#region 上傳文章
exports.articleDataUpLoad = async (req, res) => {
    try {
        //從body中取出資料並解構
        const { category, title, content, contentImgIdListData, removedImgIdListData } = req.body;
        //如果沒有標題或內容則回報錯誤
        if (!category || !title || !content) {
            return res.status(400).json({ message: "種類與標題與內容為必填" });
        }

        // 先將多餘Cloudinary圖片進行刪除
        if (Array.isArray(removedImgIdListData)) {
            for (const img of removedImgIdListData) {
                try {
                    await cloudinary.uploader.destroy(img);
                } catch (cloudError) {
                    console.error("Cloudinary 刪除失敗:", img, cloudError);
                }
            }
        }
        

        //將文章寫入資料表
        const result = await pool.query(
            `
                INSERT INTO articles (title, content, class)
                VALUES ($1, $2, $3)
                RETURNING id, class, title, content, created_at
            `,
            [title, content, category]
        );

        //取得文章id
        const articleId = result.rows[0].id;

        //如果contentImgIdListData是陣列且資料數量大於0則執行
        if (Array.isArray(contentImgIdListData) && contentImgIdListData.length > 0) {
            //把 imagePublicIds 這個陣列裡的東西每次拿一個並賦予名稱publicId在執行{}的內容
            for (const publicId of contentImgIdListData) {
                //在資料表images中新增資料
                await pool.query(
                    `
                        INSERT INTO images (article_id, cloud_id)
                        VALUES ($1, $2)
                    `,
                    [articleId, publicId.public_id]
                );
            }
        }

        //回傳成功訊息
        res.json({
            message: '文章新增成功！',
            article: result.rows[0],
        });

    } catch (err) {
        console.error('新增文章失敗:', err);
        res.status(500).json({ error: '伺服器錯誤' });
    }
};
//#endregion

//#region 更新文章
exports.updateArticle = async (req, res) => {
    try {
        // 取得文章id
        const { id } = req.params;
        // 解構來源資料
        const { category, title, content, contentImgIdListData, removedImgIdListData } = req.body;

        // 檢查必要欄位
        if (!category || !title || !content) {
            return res.status(400).json({ message: "種類與標題與內容為必填" });
        }

        // 先確認文章是否存在
        const check = await pool.query(
            `
                SELECT * FROM articles WHERE id = $1
            `,
            [id]
        );

        //如果文章不存在則回報錯誤
        if (check.rows.length === 0) {
        return res.status(404).json({ message: "文章不存在" });
        }

        // 先將多餘Cloudinary圖片進行刪除
        if (Array.isArray(removedImgIdListData)) {
            for (const img of removedImgIdListData) {
                try {
                    await cloudinary.uploader.destroy(img);
                } catch (cloudError) {
                    console.error("Cloudinary 刪除失敗:", img, cloudError);
                }
            }
        }

        //查詢舊圖片列表
        const oldImagesResult = await pool.query(
            `
                SELECT cloud_id FROM images WHERE article_id = $1
            `,
            [id]
        );

        //舊圖片id列表
        const oldImageIds = oldImagesResult.rows.map((img) => 
            {
                return(
                    img.cloud_id
                )
            }
        );

        //宣告新圖片列表
        const newImageIds = Array.isArray(contentImgIdListData) ? contentImgIdListData.map(img => img.public_id) : [];

        //對舊圖片列表進行過濾
        const removedImages = oldImageIds.filter((oldId) => !newImageIds.includes(oldId));

        //依照需要移除的圖片id列表依序刪除圖片
        for (const publicId of removedImages) {
            try {
                await cloudinary.uploader.destroy(publicId);
            } catch (err) {
                console.error("Cloudinary 刪除失敗:", publicId, err);
            }
        }

        // 先刪除images資料表中該文章的所有圖片id
        await pool.query(
            `
                DELETE FROM images WHERE article_id = $1
            `,
            [id]
        );

        // 根據新圖片列表的圖片id依序新增至images資料表
        for (const publicId of newImageIds) {
            await pool.query(
                `
                    INSERT INTO images (article_id, cloud_id)
                    VALUES ($1, $2)
                `,
                [id, publicId]
            );
        }

        // 更新文章資料
        const result = await pool.query(
            `
                UPDATE articles
                SET title = $1, content = $2
                WHERE id = $3
                RETURNING *
            `,
            [title, content, id]
        );

        // 回傳成功
        res.json({
            message: "文章更新成功",
            article: result.rows[0]
        });

    } catch (err) {
        console.error("更新文章失敗:", err);
        res.status(500).json({ error: "伺服器錯誤" });
    }
};
//#endregion

//#region 刪除文章
exports.deleteArticle = async (req, res) => {
    try {
        const { id } = req.params; // 從網址取得文章 ID

        // 先確認文章是否存在
        const check = await pool.query(
            `
                SELECT * FROM articles WHERE id = $1
            `,
            [id]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: "文章不存在" });
        }

        // 查詢該文章使用的圖片
        const imageResult = await pool.query(
            `
                SELECT cloud_id FROM images WHERE article_id = $1
            `,
            [id]
        );

        // 刪除 Cloudinary 圖片
        for (const img of imageResult.rows) {
            try {
                await cloudinary.uploader.destroy(img.cloud_id);
            } catch (cloudError) {
                console.error("Cloudinary 刪除失敗:", img.cloud_id, cloudError);
            }
        }

        // 執行刪除
        await pool.query(
            `
                DELETE FROM articles WHERE id = $1
            `, 
            [id]
        );

        res.json({
            deletedId: id
        });

    } catch (err) {
        console.error("刪除文章失敗:", err);
        res.status(500).json({ error: "伺服器錯誤" });
    }
};
//#endregion