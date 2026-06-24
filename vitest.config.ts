import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'e2e/**/*'],
    },
  })
)
