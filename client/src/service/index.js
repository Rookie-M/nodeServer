import axios from 'axios'
axios.defaults.baseURL = 'http://192.168.0.196:3000';
axios.interceptors.request.use(config => {
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    return config;
});

export function getMapResource() {
    return axios.get('/mapData')
}

export function saveData(payload) {
    return axios.post('/saveData',{...payload})
}
export var a = 10;