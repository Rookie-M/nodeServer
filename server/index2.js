var XLSX = require('xlsx');
const axios = require('axios');

axios.defaults.baseURL = 'https://restapi.amap.com/v3';
axios.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config;
})

// var workbook = XLSX.readFile('./assets/temp1.xlsx');

// workbook.SheetNames.forEach(name => {
//     var originData = XLSX.utils.sheet_to_json(workbook.Sheets[name]);
//     // test 
//     // originData = originData.slice(0,10);

//     getDistance(originData,0,name);
// })


function getLnglat(source,i){
    let data = source[i]
    axios.get('/geocode/geo',{
        params:{
            key: 'ba3e1acd20bb996de3d56aecac21aa55',
            address: data['addr'],
            city: '青岛'
        }
    }).then(res => {
        console.log('success',i)
        source[i]['latlng'] = res.data.geocodes[0].location;
         i++;
        if(i < source.length){
            getLnglat(source,i);
        }else {
            writeXLXSFile(source)
        }
    }).catch((e)=> {
        console.log('fail',i)
        i++;
        if(i < source.length){
            getLnglat(source,i);
        }else {
            writeXLXSFile(source)
        }

    })

}
function getDistance(source,i,name){
    let data = source[i]
    let j = i+1;
    axios.get('/direction/driving',{
        params:{
            key: 'ba3e1acd20bb996de3d56aecac21aa55',
            origin: data['latlng'],
            destination: source[j]['latlng']
        }
    }).then(res => {
        source[j]['距离(km)'] = res.data.route.paths[0].distance / 1000
        source[j]['预计用时(分钟)'] = res.data.route.paths[0].duration /60

        if(j < (source.length - 1)){
            getDistance(source,j,name);
        }else {
            writeXLXSFile(source,name)
        }
    }).catch((e)=> {

        if(j < (source.length - 1)){
            getDistance(source,j,name);
        }else {
            writeXLXSFile(source,name)
        }

    })
}
function writeXLXSFile(data,name) {
    console.log('name',name)
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, name);
    /* generate file and send to client */
    XLSX.writeFile(wb, "./assets/"+name+"data.xlsx");
}
var data = [
    ['1-1','1-2','1-3','1-4'],
    ['2-1','2-2','2-3','2-4'],
    ['3-1','3-2','3-3','3-4'],
    ['4-1','4-2','4-3','4-4'],
]
writeXLXSFile(data,'test')



