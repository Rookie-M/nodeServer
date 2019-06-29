function getSyncTime () {
    return new Promise((resolve, reject) =>{
        let start = new Date().getTime();
        setTimeout(() => {
            let end = new Date().getTime();
            resolve(start - end);
        },500)
    })
}

async function getSeconds() {
    let data =   await getSyncTime();
    console.log('return time', data);
}


getSeconds(); 