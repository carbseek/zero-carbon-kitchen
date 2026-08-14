import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../config'
import '../App.css'

type Row = {
  id: string; org: string; orgType: string; role: string; contact: string
  city: string; level: string; brings: string[]; message: string
  from: string; submittedAt: string
}

type Stats = {
  submissions: { total: number; valid: number; l45: number }
  cities: Record<string, { total: number; l45: number }>
  traffic: { total: number; fromArticle: number; fromTrainingEntry: number }
  updatedAt: string
}

const LEVEL_COLOR: Record<string, string> = {
  L5: 'bg-[#1a237e] text-white',
  L4: 'bg-[#3949ab] text-white',
  L3: 'bg-[#8a97d8] text-white',
  L2: 'bg-[#e3e6f5] text-[#3c4356]',
  L1: 'bg-[#f1efe8] text-[#6b7280]',
}

export default function Admin() {
  const params = new URLSearchParams(window.location.search)
  const [key, setKey] = useState(() => params.get('key') || sessionStorage.getItem('zc-admin-key') || '')
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (k: string) => {
    setLoading(true); setError('')
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_BASE}/api/admin/submissions?key=${encodeURIComponent(k)}`),
        fetch(`${API_BASE}/api/admin/stats?key=${encodeURIComponent(k)}`),
      ])
      if (!r1.ok || !r2.ok) throw new Error('unauthorized')
      const d1 = await r1.json(); const d2 = await r2.json()
      setRows(d1.rows); setStats(d2.stats)
      sessionStorage.setItem('zc-admin-key', k)
    } catch {
      setError('密钥无效或服务器未启动，请核对管理链接。')
      setRows([]); setStats(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { if (key) load(key) }, [key, load])

  const levelCount = useMemo(() => {
    const m: Record<string, number> = {}
    for (const r of rows) m[r.level] = (m[r.level] || 0) + 1
    return m
  }, [rows])

  /* ---------- 登录窗 ---------- */
  if (!stats && !loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e33] px-6">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
          <p className="text-[12px] font-bold tracking-[0.25em] text-[#8a6d00]">ADMIN · 管理后台</p>
          <h1 className="mt-2 text-2xl font-bold text-[#1a2030]">零碳厨房共创征集</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6b7280]">
            请输入管理密钥查看征集数据。密钥随服务启动生成，仅保存在部署机器上。
          </p>
          <input
            className="field-input mt-5"
            type="password"
            placeholder="管理密钥"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && input && setKey(input)}
          />
          {error && <p className="mt-3 text-[13px] text-[#b33939]">{error}</p>}
          <button
            onClick={() => input && setKey(input)}
            className="mt-4 w-full rounded-xl bg-[#1a237e] py-3.5 font-bold text-white transition hover:bg-[#232fa0]"
          >
            进入后台
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1efe8]">
      {/* 顶栏 */}
      <header className="bg-[#0a0e33]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <p className="text-[11px] font-bold tracking-[0.25em] text-[#ffc107]">ADMIN · 管理后台</p>
            <h1 className="mt-1 text-xl font-bold text-white">零碳厨房共创征集 · 数据看板</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => key && load(key)}
              className="rounded-lg border border-white/25 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-white/10"
            >
              刷新数据
            </button>
            <a
              href={`${API_BASE}/api/admin/export?key=${encodeURIComponent(key)}`}
              className="rounded-lg bg-[#ffc107] px-4 py-2 text-[13px] font-bold text-[#0a0e33] transition hover:bg-[#ffcd2e]"
            >
              导出 CSV
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* 指标卡 */}
        {stats && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: '征集表提交量', value: stats.submissions.total, target: '目标 50+', accent: false },
                { label: '有效征集（有单位+职务）', value: stats.submissions.valid, target: '目标 30+', accent: false },
                { label: 'L4/L5 高意向单位', value: stats.submissions.l45, target: '目标 15+ · 选址依据', accent: true },
                { label: '页面访问量', value: stats.traffic.total, target: `培训入口 ${stats.traffic.fromTrainingEntry}`, accent: false },
              ].map((c) => (
                <div key={c.label} className={`rounded-2xl p-5 shadow-sm ${c.accent ? 'bg-[#1a237e] text-white' : 'bg-white'}`}>
                  <p className={`text-[12px] font-medium ${c.accent ? 'text-[#c9cfef]' : 'text-[#6b7280]'}`}>{c.label}</p>
                  <p className={`mt-2 text-4xl font-bold ${c.accent ? 'text-[#ffc107]' : 'text-[#1a2030]'}`}>{c.value}</p>
                  <p className={`mt-1.5 text-[11.5px] ${c.accent ? 'text-[#a9b0dd]' : 'text-[#9aa0ae]'}`}>{c.target}</p>
                </div>
              ))}
            </div>

            {/* 分城市追踪 */}
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[16px] font-bold text-[#1a2030]">分城市追踪</h2>
                <p className="text-[12px] text-[#9aa0ae]">选址决策只看 L4/L5 高意向单位分布，不看总票数</p>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-[13.5px]">
                  <thead>
                    <tr className="border-b border-[#e8e6de] text-[12px] text-[#9aa0ae]">
                      <th className="pb-2.5 font-medium">候选城市</th>
                      <th className="pb-2.5 font-medium">提交数</th>
                      <th className="pb-2.5 font-medium">L4/L5 高意向</th>
                      <th className="pb-2.5 font-medium">意向等级分布</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(stats.cities).map(([city, v]) => (
                      <tr key={city} className="border-b border-[#f1efe8] last:border-0">
                        <td className="py-3 font-bold text-[#1a2030]">{city}</td>
                        <td className="py-3">{v.total}</td>
                        <td className="py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${v.l45 > 0 ? 'bg-[#1a237e] text-[#ffc107]' : 'bg-[#f1efe8] text-[#9aa0ae]'}`}>
                            {v.l45}
                          </span>
                        </td>
                        <td className="py-3 text-[#6b7280]">
                          {(['L5','L4','L3','L2','L1'] as const).map((l) =>
                            levelCount[l] ? `${l}×${levelCount[l]}` : null).filter(Boolean).join(' · ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 提交明细 */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-[16px] font-bold text-[#1a2030]">提交明细（{rows.length}）</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e8e6de] text-[12px] text-[#9aa0ae]">
                  {['时间', '编号', '单位', '职务 / 联系方式', '城市', '意向', '带来', '问题或方案', '来源'].map((h) => (
                    <th key={h} className="pb-2.5 pr-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="py-10 text-center text-[#9aa0ae]">暂无提交记录</td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-[#f5f3ec] align-top last:border-0">
                    <td className="py-3 pr-4 whitespace-nowrap text-[#6b7280]">
                      {new Date(r.submittedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11.5px] text-[#9aa0ae]">{r.id}</td>
                    <td className="py-3 pr-4">
                      <p className="font-bold text-[#1a2030]">{r.org || '（未填）'}</p>
                      <p className="mt-0.5 text-[12px] text-[#9aa0ae]">{r.orgType}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <p>{r.role || '—'}</p>
                      <p className="mt-0.5 text-[12px] text-[#6b7280]">{r.contact}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">{r.city}</td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${LEVEL_COLOR[r.level] || ''}`}>{r.level}</span>
                    </td>
                    <td className="py-3 pr-4 text-[#6b7280]">{r.brings?.join('、') || '—'}</td>
                    <td className="max-w-[260px] py-3 pr-4 text-[#3c4356]">{r.message || '—'}</td>
                    <td className="py-3 text-[11.5px] text-[#9aa0ae]">{r.from}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-[#9aa0ae]">
          数据仅保存在部署机器本地（server/data/），未经匿名汇总与授权不得对外发布 · 更新时间：
          {stats ? new Date(stats.updatedAt).toLocaleString('zh-CN') : '—'}
        </p>
      </main>
    </div>
  )
}
