// ==========================================
// 🚀 赛博朋克·全息天气时钟 (支持访客IP定位)
// ==========================================
const WEATHER_HOST = "https://mj4bj7ax2x.re.qweatherapi.com";
const WEATHER_KEY = "4415931d12bd4e378040304a3ae0178c";
const GAUD_MAP_KEY = "96f83bc79ccb65041283896348efa4e1"; // 高德地图 Key
const DEFAULT_CITY = "广州"; // 定位失败时的默认城市

let clockTimer = null;
let currentCity = DEFAULT_CITY;

function initCustomClock() {
    if (document.getElementById('my-custom-clock')) return;

    const asideContent = document.querySelector('.aside-content');
    const recentPostCard = document.querySelector('.card-recent-post');
    
    if (!asideContent) return; 

    const clockHtml = `
        <div id="my-custom-clock" class="card-widget">
            <!-- 头部：位置与天气 -->
            <div class="clock-header">
                <span class="location-text" id="clock-location">📍 定位中...</span>
                <div class="weather-box" id="clock-weather-box">
                    <span class="weather-icon" id="clock-weather-icon">🌤️</span>
                    <span class="weather-text" id="clock-weather">获取中</span>
                </div>
            </div>
            
            <!-- 中部：时间与日期 -->
            <div class="clock-body">
                <div class="time-text" id="clock-time">00:00:00</div>
                <div class="date-text" id="clock-date">加载中...</div>
            </div>
            
            <!-- 今日进度条 -->
            <div class="progress-container">
                <div class="progress-bar" id="clock-progress"></div>
            </div>
            
            <!-- 底部：详细数据 -->
            <div class="clock-footer">
                <div class="data-item">
                    <span class="label">体感</span>
                    <span class="value" id="clock-feelslike">--℃</span>
                </div>
                <div class="data-item">
                    <span class="label">湿度</span>
                    <span class="value" id="clock-humidity">--%</span>
                </div>
                <div class="data-item">
                    <span class="label">风向</span>
                    <span class="value" id="clock-wind">--</span>
                </div>
            </div>
        </div>
    `;

    if (recentPostCard) {
        recentPostCard.insertAdjacentHTML('beforebegin', clockHtml);
    } else {
        asideContent.insertAdjacentHTML('beforeend', clockHtml);
    }

    updateTime();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(updateTime, 1000);

    // 第一步：获取访客IP位置
    getUserLocation();
}

// 更新时间和进度条
function updateTime() {
    const now = new Date();
    const timeEl = document.getElementById('clock-time');
    const dateEl = document.getElementById('clock-date');
    const progressEl = document.getElementById('clock-progress');
    
    if (timeEl && dateEl) {
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        timeEl.textContent = `${h}:${m}:${s}`;

        const y = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        const week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
        dateEl.textContent = `${y}-${month}-${d} ${week}`;
    }

    // 计算今日进度 (0% - 100%)
    if (progressEl) {
        const secondsToday = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        const percent = (secondsToday / 86400) * 100;
        progressEl.style.width = `${percent}%`;
    }
}

// 获取访客IP所在城市
async function getUserLocation() {
    try {
        // 使用高德地图 IP 定位
        const res = await fetch(`https://restapi.amap.com/v3/ip?key=${GAUD_MAP_KEY}`);
        const data = await res.json();
        
        // 高德返回的 city 可能是空字符串（局域网）或数组（直辖市）
        let city = data.city;
        if (Array.isArray(city)) city = city[0];
        
        if (data.status === "1" && city) {
            currentCity = city;
        } else {
            currentCity = DEFAULT_CITY;
        }
    } catch (error) {
        console.error("IP定位失败，使用默认城市", error);
        currentCity = DEFAULT_CITY;
    }
    
    document.getElementById('clock-location').textContent = `📍 ${currentCity}`;
    fetchWeather(currentCity);
}

// 获取天气
async function fetchWeather(cityName) {
    try {
        const geoRes = await fetch(`${WEATHER_HOST}/geo/v2/city/lookup?location=${encodeURIComponent(cityName)}&key=${WEATHER_KEY}`);
        const geoData = await geoRes.json();
        if (geoData.code !== "200" || !geoData.location) throw new Error("城市查询失败");
        
        const locationId = geoData.location[0].id;
        const weatherRes = await fetch(`${WEATHER_HOST}/v7/weather/now?location=${locationId}&key=${WEATHER_KEY}`);
        const weatherData = await weatherRes.json();
        if (weatherData.code !== "200") throw new Error("天气获取失败");

        const now = weatherData.now;
        const weatherIconEl = document.getElementById('clock-weather-icon');
        const weatherEl = document.getElementById('clock-weather');
        const humidityEl = document.getElementById('clock-humidity');
        const feelslikeEl = document.getElementById('clock-feelslike');
        const windEl = document.getElementById('clock-wind');
        
        if (weatherEl) {
            let icon = '🌤️';
            if (now.text.includes('云')) icon = '☁️';
            if (now.text.includes('雨')) icon = '🌧️';
            if (now.text.includes('晴')) icon = '☀️';
            if (now.text.includes('雪')) icon = '❄️';
            if (now.text.includes('阴')) icon = '☁️';
            
            weatherIconEl.textContent = icon;
            weatherEl.textContent = `${now.text} ${now.temp}℃`;
            humidityEl.textContent = `${now.humidity}%`;
            feelslikeEl.textContent = `${now.feelsLike}℃`;
            windEl.textContent = now.windDir;
        }
    } catch (error) {
        console.error("天气获取失败:", error);
        const weatherEl = document.getElementById('clock-weather');
        if (weatherEl) weatherEl.textContent = `天气获取失败`;
    }
}

document.addEventListener('DOMContentLoaded', initCustomClock);
document.addEventListener('pjax:complete', initCustomClock);
setInterval(initCustomClock, 1000);