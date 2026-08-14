/**
 * API 基址配置
 * - 同源部署（一体化服务器）：留空字符串，前端直接请求 /api/...
 * - 静态托管（GitHub Pages 等）：构建时通过 VITE_API_BASE 指向后端服务地址
 */
export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) || ''
