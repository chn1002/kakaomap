// index.js 또는 server.js
const express = require('express');
const path = require('path');
const config = require('config');
const app = express();
const PORT = process.env.PORT || 8080;

// 뷰 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 루트 경로 설정
app.get('/', (req, res) => {
  const apiKey = config.get('kakao.javascriptKey');
  res.render('index', { apiKey });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
