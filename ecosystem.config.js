/**
 * PM2 Ecosystem Configuration
 * GURU Admin Portal + Backend API
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'guru-api',
      script: 'dist/index.js',
      cwd: '/var/www/guru',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      // Logging
      error_file: '/var/log/guru/error.log',
      out_file: '/var/log/guru/out.log',
      log_file: '/var/log/guru/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Restart behavior
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
