// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		host: true,                                 // 0.0.0.0 で外部(プレビュー)からもアクセス可
		port: Number(process.env.PORT) || 5173,     // Replit が割り当てる PORT を使用
		strictPort: true,
		allowedHosts: true                          // ★ ランダムな *.replit.dev を全許可
		// 必要ならオーバーレイ無効化: hmr: { overlay: false }
	},
	preview: {
		host: true,
		port: Number(process.env.PORT) || 5173,
		allowedHosts: true
	}
});