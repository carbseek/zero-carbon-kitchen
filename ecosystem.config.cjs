// PM2 进程守护配置（适用于云服务器 / 长期运行的主机）
// 用法：pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
module.exports = {
  apps: [
    {
      name: "zc-kitchen",
      script: "server/server.js",
      env: {
        NODE_ENV: "production",
        PORT: 8787,
        // ADMIN_KEY: "在此固定一个强密钥；不设置则自动生成并写入 server/admin-key.txt",
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      out_file: "server/server.log",
      error_file: "server/server.log",
      time: true,
    },
  ],
};
