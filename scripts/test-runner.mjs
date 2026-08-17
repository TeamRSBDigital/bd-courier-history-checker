import { spawnSync } from 'node:child_process';
const env = {
  ...process.env,
  APP_ENV: 'test',
  MOCK_COURIERS: 'true',
  PHONE_HMAC_SECRET: 'test-phone-hmac-secret-0123456789abcdef',
  ADMIN_USERNAME: 'admin-test',
  ADMIN_PASSWORD_SALT: 'test-salt',
  ADMIN_PASSWORD_HASH: '6fd1f08dcc1a8ebede023804d7cf53201e7d556264aecfbe245da90deb11e0c8',
  ADMIN_SESSION_SECRET: 'test-admin-session-secret-0123456789abcdef',
  RATE_LIMIT_REQUESTS: '50'
};
const result = spawnSync(process.execPath, ['--disable-warning=ExperimentalWarning', '--experimental-strip-types', '--test', 'tests/*.test.ts'], { stdio: 'inherit', shell: true, env });
process.exit(result.status ?? 1);
