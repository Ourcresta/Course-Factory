/**
 * PM2 Ecosystem Configuration
 * OurShiksha Guru - Admin Course Factory
 * 
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 restart ourshiksha-guru
 *   pm2 logs ourshiksha-guru
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'ourshiksha-guru',
      script: 'dist/index.js',
      cwd: '/var/www/ourshiksha-guru',
      
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      source_map_support: true,
      ignore_watch: ['node_modules', 'logs', 'uploads', '.git'],
    },
  ],
  
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.milesweb.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-org/ourshiksha-guru.git',
      path: '/var/www/ourshiksha-guru',
      'pre-deploy-local': '',
      'post-deploy': 'npm ci && npm run build && npm run db:push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
