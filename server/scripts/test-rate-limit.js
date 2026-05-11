#!/usr/bin/env node
/**
 * 速率限制测试脚本
 * 测试全局速率限制是否生效
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let requestCount = 0;
let rateLimited = false;

console.log('🧪 开始速率限制测试...');
console.log('   配置：100次请求/60秒窗口\n');

// 发送单个请求
function sendRequest(requestNum) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '192.168.1.100', // 模拟同一IP
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        requestCount++;
        
        if (res.statusCode === 429) {
          console.log(`  ✅ 第 ${requestNum} 次请求触发速率限制 (429 Too Many Requests)`);
          console.log(`     响应: ${data.substring(0, 100)}...`);
          rateLimited = true;
          resolve({ statusCode: res.statusCode, rateLimited: true });
        } else {
          if (requestNum <= 10 || requestNum % 50 === 0) {
            console.log(`  ℹ️  第 ${requestNum} 次请求: ${res.statusCode}`);
          }
          resolve({ statusCode: res.statusCode, rateLimited: false });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`  ❌ 请求 ${requestNum} 失败: ${err.message}`);
      reject(err);
    });

    req.write(JSON.stringify({ username: 'test', password: 'test' }));
    req.end();
  });
}

// 发送大量请求测试速率限制
async function runTest() {
  console.log('🚀 发送101次请求（超过100次限制）...\n');
  
  for (let i = 1; i <= 101; i++) {
    try {
      const result = await sendRequest(i);
      if (result.rateLimited) {
        console.log(`\n🎉 速率限制成功触发！`);
        console.log(`   在 ${i} 次请求后触发 429 错误`);
        console.log(`   配置生效：100次/60秒\n`);
        process.exit(0);
      }
    } catch (err) {
      console.error(`请求 ${i} 失败:`, err.message);
    }
    
    // 每10次请求暂停一下，避免过快
    if (i % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  if (!rateLimited) {
    console.log('\n⚠️  速率限制未触发');
    console.log('   可能原因：');
    console.log('   1. 配置未生效');
    console.log('   2. 每个请求被认为是不同IP');
    console.log('   3. 速率限制配置错误\n');
    process.exit(1);
  }
}

// 检查服务器是否运行
const checkServer = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET',
}, (res) => {
  console.log('✅ 服务器运行正常\n');
  runTest();
});

checkServer.on('error', (err) => {
  console.error('❌ 服务器未运行！');
  console.error('   请先启动服务器：');
  console.error('   cd server');
  console.error('   npm run dev\n');
  process.exit(1);
});

checkServer.end();
