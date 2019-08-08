const router = require('koa-router')();
const XLSX = require('xlsx');
const path = require('path');
const send = require('koa-send');

module.exports = app => {
    router.get('/', async(ctx, next) => {
        ctx.response.body = `<h1>index page</h1>`
    })
      
    router.get('/mapData', async (ctx, next) => {
        var workbook = XLSX.readFile(_resolve('../assets/data7.1Parse.xlsx'));
        gridSource = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        ctx.response.body = gridSource;
    })

    router.post('/saveData', async(ctx,next) => {
        let {storage} = ctx.request.body;
        const ws = XLSX.utils.json_to_sheet(storage);
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, ws, "前置仓库");
        await XLSX.writeFile(wb, _resolve("../assets/storage.xlsx"));

        ctx.response.body = 'ok';

    })

    router.get('/download', async(ctx,next) => {

        var fileName = 'storage.xlsx';
        // Set Content-Disposition to "attachment" to signal the client to prompt for download.
        // Optionally specify the filename of the download.
        // 设置实体头（表示消息体的附加信息的头字段）,提示浏览器以文件下载的方式打开
        // 也可以直接设置 ctx.set("Content-disposition", "attachment; filename=" + fileName);
        ctx.attachment(fileName);
        await send(ctx, fileName, { root: _resolve('../assets')});

    })

    app.use(router.routes()).use(router.allowedMethods())
}

function _resolve(_path){
    return path.resolve(__dirname, _path)
}
function writeXLXSFile() {
    const ws = XLSX.utils.json_to_sheet(gridSource);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "社区列表");
    XLSX.utils.book_append_sheet(wb, ws2, "社区围栏");
    /* generate file and send to client */
    XLSX.writeFile(wb, _resolve("./assets/distanceParse.xlsx"));

}