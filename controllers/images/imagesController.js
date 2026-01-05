const cloudinary = require('../../utils/cloudinary');
const fs = require('fs');//fs為Node.js 內建模組
//意思是FileSystem（檔案系統）
//作用是讓 JavaScript 可以「讀 / 寫 / 刪 / 操作」電腦上的檔案

//#region
//#endregion

//#region 取得圖片清單
exports.getImages = async (req, res) => {
try {
    //取得資料夾名稱
    const { folder } = req.query;

    //如果沒有資料夾名稱則回報錯誤
    if (!folder) {
        return res.status(400).json({ message: '缺少 folder 參數' });
    }

    const result = await cloudinary.api.resources({
        //upload 代表 自己上傳的圖片
        type: 'upload',
        //${folder} 代表 目標資料夾的名稱
        // 例如 articles/
        prefix: `${folder}/`, 
        //一次取最多30張圖片
        max_results: 30,
    });

    // 精簡回傳資料
    const images = result.resources.map((img) => ({
        public_id: img.public_id,
        url: img.secure_url,
        created_at: img.created_at,
    }));

    //回傳圖片資料
    res.json(images);

} catch (error) {
    console.error('取得圖片清單失敗:', error);
    res.status(500).json({ message: '取得圖片清單失敗' });
}
};
//#endregion

//#region 上傳圖片
exports.uploadImage = async (req, res) => {

    //取得圖片資料
    const file = req.file;

    //取得資料夾名稱
    const folder = req.body.folder || 'testFolder';

    //如果沒有圖片資料則回報錯誤
    if (!file) {
        return res.status(400).json({ message: '沒有收到圖片' });
    }

    let filePath;

    filePath = file.path;

    try {

        const result = await cloudinary.uploader.upload(
            file.path, {
                folder,
            }
        );

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (error) {
        console.error('圖片上傳失敗', error);
        res.status(500).json({ message: '圖片上傳失敗' });
    } finally {
        if (filePath) {
            //.unlink的意思是從硬碟上「刪除filePath的檔案」
            fs.unlink(filePath, (error) => {
                if (error) {
                    console.error('刪除 temp 檔案失敗:', error);
                }
            });
        }
    }
};
//#endregion

//#region 覆蓋圖片
exports.uploadImageChange = async (req, res) => {
    let filePath;

    try {
        //取出圖片資料
        const file = req.file;
        //取出圖片ID
        const { public_id } = req.body;

        //如果沒有圖片檔案或ID則回報錯誤
        if (!file || !public_id) {
            return res.status(400).json({
                message: '缺少圖片或 public_id',
            });
        }
        //將圖片網址存於filePath
        filePath = file.path;

        const result = await cloudinary.uploader.upload(file.path, {
            public_id,        //指定同一張圖
            overwrite: true,  //允許覆蓋
            invalidate: true, //清 CDN 快取
        });

        res.json({
            message: '圖片已覆蓋成功',
            url: result.secure_url,
            public_id: result.public_id,
        });

    } catch (error) {
        console.error('覆蓋圖片失敗:', error);
        res.status(500).json({ message: '覆蓋圖片失敗' });
    } finally {
        if (filePath) {
            fs.unlink(filePath, () => {});
        }
    }
};
//#endregion

//#region 刪除圖片
exports.deleteImage = async (req, res) => {
    try {
        //取出圖片id
        const { public_id } = req.query;

        //圖果圖片id不存在則回報錯誤
        if (!public_id) {
            return res.status(400).json({ message: '缺少圖片public_id' });
        }

        //呼叫 Cloudinary 刪除圖片
        const result = await cloudinary.uploader.destroy(public_id);

        //如果結果不是ok則回報錯誤
        if (result.result !== 'ok') {
            return res.status(404).json({
                message: '圖片不存在或已刪除',
                cloudinaryResult: result,
            });
        }

        //成功
        res.json({
            message: '圖片已成功刪除',
        });

    } catch (error) {
        console.error('Cloudinary 刪除失敗:', error);
        res.status(500).json({ message: '圖片刪除失敗' });
    }
};
//#endregion