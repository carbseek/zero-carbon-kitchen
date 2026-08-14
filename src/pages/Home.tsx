import { useMemo, useState, useEffect } from 'react'
import { API_BASE } from '../config'
import '../App.css'

/* ================= 内容配置（发布前由主办方确认） ================= */

const SITE = {
  series: '碳尺行动 · 共创征集',
  title: '零碳厨房共创征集',
  subtitle: '一间真实厨房，正在寻找共同解题者',
  dateLine: '2026年9月18—19日 · 两天线下共创',
  dateNote: '尚未最终确定，以征集结果为准',
  warn1: '本次不是正式报名，不收取任何费用',
  warn2: '时间、地点和最终方案将根据征集结果确定',
}

const LOCATIONS = [
  { city: '上海奉贤', venue: '零碳厨房会客厅', main: true },
  { city: '佛山', venue: '广东省碳标签产业研究院', main: true },
  { city: '山东济南', venue: '视高意向单位分布确定', main: false },
]

const AUDIENCES = [
  '高校 / 医院 / 机关后勤管理者',
  '团餐、酒店及餐饮企业负责人',
  '商用厨具、节能设备与供应链企业',
  '碳评价、咨询及专业服务机构',
  '碳标签评价师前 19 期学员',
]

const DECISIONS = [
  { no: '01', text: '活动是否举办' },
  { no: '02', text: '最终选择哪个城市' },
  { no: '03', text: '两天解决哪些核心问题' },
  { no: '04', text: '评价体系在真实场景中是否可行' },
]

const ORG_TYPES = [
  '高校 / 医院 / 机关等公共机构后勤',
  '团餐、酒店及餐饮企业',
  '商用厨具、节能设备和供应链企业',
  '碳评价、咨询及专业服务机构',
  '碳标签评价师前 19 期学员',
  '其他',
]

const CITIES = ['上海奉贤', '佛山', '山东济南', '均可，服从安排']

const LEVELS = [
  { id: 'L1', label: 'L1 · 仅保持关注' },
  { id: 'L2', label: 'L2 · 愿意线上交流' },
  { id: 'L3', label: 'L3 · 愿意参加一对一需求访谈' },
  { id: 'L4', label: 'L4 · 有真实项目，愿意带到现场' },
  { id: 'L5', label: 'L5 · 有决策权，可现场确定方向' },
]

const BRINGS = ['一间真实厨房', '一个真实数据问题', '一项真实解决方案', '其他']

const COURSES = [
  {
    org: 'CarbSeek Academy',
    name: '碳标领航 · 零碳厨房项目实战营',
    desc: '围绕项目边界、数据台账、评价路径、场景诊断与持续改进展开，适合参与零碳厨房建设和运营的管理、采购、运维与服务团队。',
  },
  {
    org: '实战研修',
    name: '碳足迹评价与公共机构食堂节能降碳实战研修班',
    desc: '聚焦公共机构食堂的碳足迹评价、节能降碳组织实施、数据治理与案例研讨，适合高校、医院、机关及相关服务单位的管理与技术人员。',
  },
]

/* ================= 小组件 ================= */

function SectionTitle({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3">
        <span className="inline-block h-6 w-1.5 rounded-full bg-[#ffc107]" />
        <span className="text-[13px] font-bold tracking-[0.2em] text-[#8a6d00]">{kicker}</span>
      </div>
      <h2 className="mt-3 text-[26px] font-bold leading-snug text-[#1a2030]">{title}</h2>
      {desc && <p className="mt-2 text-[15px] leading-relaxed text-[#6b7280]">{desc}</p>}
    </div>
  )
}

function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 fill-[#ffc107]">
      <path d="M12 2 1 21h22L12 2zm0 6.5 6.8 11H5.2L12 8.5zM11 12h2v4h-2v-4zm0 5h2v2h-2v-2z" />
    </svg>
  )
}

/* ================= 表单 ================= */

type FormState = {
  org: string
  orgType: string
  role: string
  contact: string
  city: string
  level: string
  brings: string[]
  message: string
  agree: boolean
}

const EMPTY: FormState = {
  org: '', orgType: '', role: '', contact: '',
  city: '', level: '', brings: [], message: '', agree: false,
}

function CoCreateForm() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<string[]>([])
  const [ticket, setTicket] = useState<string | null>(null)

  const fromParam = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return new URLSearchParams(window.location.search).get('from') || 'direct'
  }, [])

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const toggleBring = (b: string) =>
    setForm((f) => ({
      ...f,
      brings: f.brings.includes(b) ? f.brings.filter((x) => x !== b) : [...f.brings, b],
    }))

  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const errs: string[] = []
    if (!form.orgType) errs.push('请选择单位类型')
    if (!form.contact.trim()) errs.push('请填写联系方式（仅用于一对一访谈邀约）')
    if (!form.city) errs.push('请选择优先地点')
    if (!form.level) errs.push('请选择参与意向')
    if (!form.agree) errs.push('请阅读并勾选隐私说明')
    setErrors(errs)
    if (errs.length || submitting) return

    setSubmitting(true)
    let id = 'ZC-' + Date.now().toString(36).toUpperCase() + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase()
    const record = { ...form, from: fromParam, submittedAt: new Date().toISOString() }
    try {
      const resp = await fetch(`${API_BASE}/api/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      })
      const data = await resp.json()
      if (resp.ok && data.ok) id = data.id
      else throw new Error('server rejected')
    } catch {
      // 后端不可达时降级保存到本机浏览器
      try {
        const key = 'zc-kitchen-cocreate'
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        list.push({ id, ...record })
        localStorage.setItem(key, JSON.stringify(list))
      } catch { /* 隐私模式下静默降级 */ }
    }
    setSubmitting(false)
    setTicket(id)
    window.scrollTo({ top: document.getElementById('cocreate')?.offsetTop ?? 0, behavior: 'smooth' })
  }

  if (ticket) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[0_8px_40px_rgba(26,35,126,0.10)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#1a237e]">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-[#ffc107]" strokeWidth="2.5">
            <path d="M4 12.5 9.5 18 20 6.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-5 text-2xl font-bold text-[#1a2030]">提交成功</h3>
        <p className="mt-2 text-sm text-[#6b7280]">您的共创征集编号</p>
        <p className="mt-1 font-mono text-lg font-bold tracking-wider text-[#1a237e]">{ticket}</p>
        <div className="mx-auto mt-6 max-w-md rounded-xl bg-[#faf8f3] p-4 text-left text-[13.5px] leading-relaxed text-[#5b6272]">
          征集结束后，我们将在取得授权并完成匿名汇总后，视情况发布相关洞察，
          并邀请部分单位参加一对一需求访谈。时间、地点和最终方案将根据征集结果确定。
        </div>
        <button
          onClick={() => { setForm(EMPTY); setTicket(null) }}
          className="mt-6 text-sm font-medium text-[#1a237e] underline underline-offset-4"
        >
          再提交一份
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-[0_8px_40px_rgba(26,35,126,0.10)] sm:p-8">
      <div className="space-y-6">
        {/* 单位信息 */}
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1a2030]">单位名称</label>
          <input
            className="field-input"
            placeholder="可脱敏填写，如：某高校后勤处"
            value={form.org}
            onChange={(e) => set('org', e.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-[#1a2030]">
            单位类型 <span className="text-[#c2410c]">*</span>
          </label>
          <select
            className="field-input appearance-none"
            value={form.orgType}
            onChange={(e) => set('orgType', e.target.value)}
          >
            <option value="" disabled>请选择</option>
            {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-bold text-[#1a2030]">您的职务</label>
            <input
              className="field-input"
              placeholder="如：后勤处副处长"
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-bold text-[#1a2030]">
              联系方式 <span className="text-[#c2410c]">*</span>
            </label>
            <input
              className="field-input"
              placeholder="手机或邮箱，仅用于访谈邀约"
              value={form.contact}
              onChange={(e) => set('contact', e.target.value)}
            />
          </div>
        </div>

        {/* 优先地点 */}
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1a2030]">
            优先地点 <span className="text-[#c2410c]">*</span>
          </label>
          <div className="flex flex-wrap gap-2.5">
            {CITIES.map((c) => (
              <button
                key={c} type="button"
                data-on={form.city === c}
                className="chip-option"
                onClick={() => set('city', c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* 参与意向 */}
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1a2030]">
            参与意向 <span className="text-[#c2410c]">*</span>
          </label>
          <div className="space-y-2.5">
            {LEVELS.map((l) => (
              <button
                key={l.id} type="button"
                onClick={() => set('level', l.id)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14.5px] transition ${
                  form.level === l.id
                    ? 'border-[#1a237e] bg-[#1a237e]/5 font-medium text-[#1a237e]'
                    : 'border-[#d8d5cc] bg-white text-[#3c4356] hover:border-[#1a237e]/40'
                }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  form.level === l.id ? 'border-[#1a237e]' : 'border-[#c5c2b8]'
                }`}>
                  {form.level === l.id && <span className="h-2.5 w-2.5 rounded-full bg-[#1a237e]" />}
                </span>
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#9aa0ae]">
            选址决策将依据 L4 / L5 高意向单位的城市分布，而非总票数。
          </p>
        </div>

        {/* 您希望带来 */}
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1a2030]">您希望带来（可多选）</label>
          <div className="flex flex-wrap gap-2.5">
            {BRINGS.map((b) => (
              <button
                key={b} type="button"
                data-on={form.brings.includes(b)}
                className="chip-option"
                onClick={() => toggleBring(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* 描述 */}
        <div>
          <label className="mb-2 block text-sm font-bold text-[#1a2030]">
            您想解决的问题，或希望验证的方案
          </label>
          <textarea
            className="field-input min-h-[110px] resize-y"
            placeholder="例如：燃气表计服务整栋建筑，无法对应单个档口，如何分摊？"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
          />
        </div>

        {/* 隐私同意 */}
        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[#faf8f3] p-4">
          <input
            type="checkbox"
            checked={form.agree}
            onChange={(e) => set('agree', e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#1a237e]"
          />
          <span className="text-[13px] leading-relaxed text-[#5b6272]">
            我已阅读并同意本页底部《隐私说明》：所提交信息仅用于本次共创征集的需求汇总与访谈邀约，
            涉及单位经营与排放的信息将在取得授权并完成匿名汇总后才可能对外发布。
          </span>
        </label>

        {errors.length > 0 && (
          <div className="rounded-xl border border-[#f3c2c2] bg-[#fdf3f3] p-4">
            {errors.map((e) => (
              <p key={e} className="text-[13.5px] text-[#b33939]">· {e}</p>
            ))}
          </div>
        )}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full rounded-xl bg-[#1a237e] py-4 text-[16px] font-bold tracking-wide text-white
            shadow-[0_6px_24px_rgba(26,35,126,0.35)] transition hover:bg-[#232fa0] active:scale-[0.99]
            disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? '正在提交…' : '提交共创征集'}
        </button>
        <p className="text-center text-xs text-[#9aa0ae]">
          填写时间约 3—5 分钟 · 本次不是正式报名，不收取任何费用
        </p>
      </div>
    </div>
  )
}

/* ================= 页面主体 ================= */

export default function Home() {
  // 静态托管（GitHub Pages）下向管理端上报来源参数；同源部署时无需 beacon
  useEffect(() => {
    if (!API_BASE) return
    const from = new URLSearchParams(window.location.search).get('from') || 'direct'
    fetch(`${API_BASE}/api/track?from=${encodeURIComponent(from)}`).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* ===== Hero ===== */}
      <header className="hero-grid relative overflow-hidden bg-[#0a0e33]">
        {/* 装饰碳尺 */}
        <div className="ruler-band pointer-events-none absolute -right-16 top-14 h-14 w-[340px] rotate-[-14deg] opacity-70 sm:right-8 sm:w-[420px]" />
        <div className="ruler-band pointer-events-none absolute -left-24 bottom-10 h-10 w-[300px] rotate-[-14deg] opacity-30" />

        <div className="relative mx-auto max-w-3xl px-6 pb-16 pt-10 sm:pt-14">
          {/* 顶栏 */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold tracking-[0.25em] text-[#ffc107]">
              {SITE.series}
            </span>
            <span className="hidden text-[12px] tracking-widest text-[#8f97c9] sm:block">
              CARBON RULER · CO-CREATE
            </span>
          </div>
          <div className="tick-divider mt-3 w-24" />

          <h1 className="mt-10 text-[40px] font-bold leading-tight text-white sm:text-[52px]">
            {SITE.title}
          </h1>
          <p className="mt-4 text-[19px] leading-relaxed text-[#c9cfef] sm:text-[21px]">
            {SITE.subtitle}
          </p>

          {/* 拟定时间 */}
          <div className="glass-card mt-10 flex flex-col gap-3 rounded-2xl p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-[12.5px] font-bold tracking-[0.2em] text-[#ffc107]">拟定时间</p>
              <p className="mt-1.5 text-[19px] font-bold text-white sm:text-[21px]">{SITE.dateLine}</p>
            </div>
            <p className="text-[13px] leading-relaxed text-[#a9b0dd] sm:max-w-[150px] sm:text-right">
              {SITE.dateNote}
            </p>
          </div>

          {/* 警示条 */}
          <div className="mt-5 space-y-2.5 rounded-2xl border-2 border-[#ffc107]/80 bg-[#ffc107]/5 p-5">
            {[SITE.warn1, SITE.warn2].map((w) => (
              <div key={w} className="flex items-start gap-3">
                <WarnIcon />
                <p className="text-[15.5px] font-bold leading-relaxed text-[#ffc107]">{w}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href="#cocreate"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ffc107] px-8 py-4 text-[16px] font-bold
                text-[#0a0e33] shadow-[0_6px_28px_rgba(255,193,7,0.35)] transition hover:bg-[#ffcd2e] active:scale-[0.99]"
            >
              参与共创征集
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5">
                <path d="M12 4v16m0 0 6-6m-6 6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <span className="text-[13.5px] text-[#a9b0dd]">填写时间约 3—5 分钟</span>
          </div>
        </div>
      </header>

      {/* ===== 候选地点 ===== */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <SectionTitle
          kicker="LOCATIONS"
          title="候选地点"
          desc="三个候选城市，两种权重 —— 选址不按票数，按 A 级真实线索分布决定。"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {LOCATIONS.filter((l) => l.main).map((l) => (
            <div key={l.city} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(26,35,126,0.07)]">
              <span className="absolute inset-y-0 left-0 w-1.5 bg-[#ffc107]" />
              <p className="text-[22px] font-bold text-[#1a237e]">{l.city}</p>
              <p className="mt-1.5 text-[14.5px] text-[#6b7280]">{l.venue}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-[#b9bccf] px-6 py-4 text-center">
          <p className="text-[14.5px] text-[#5b6272]">
            <span className="font-bold">山东济南</span> · 视高意向单位分布确定
          </p>
        </div>
      </section>

      {/* ===== 期待听到 ===== */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <SectionTitle
            kicker="WHO"
            title="我们期待听到这些真实声音"
            desc="如果您愿意带来一间真实厨房、一个真实数据问题或一项真实解决方案，欢迎参与本次共创征集。"
          />
          <div className="flex flex-wrap gap-3">
            {AUDIENCES.map((a) => (
              <span
                key={a}
                className="rounded-full border border-[#d8d5cc] bg-[#faf8f3] px-5 py-2.5 text-[14.5px] text-[#3c4356]"
              >
                {a}
              </span>
            ))}
          </div>

          {/* 您的意见将直接决定 */}
          <div className="mt-12 rounded-2xl bg-[#0a0e33] p-7 sm:p-9">
            <p className="text-[13px] font-bold tracking-[0.2em] text-[#ffc107]">您的意见将直接决定</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {DECISIONS.map((d) => (
                <div key={d.no} className="flex items-start gap-4">
                  <span className="font-mono text-[15px] font-bold text-[#ffc107]/80">{d.no}</span>
                  <p className="text-[16px] font-medium leading-relaxed text-white">{d.text}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 border-t border-white/10 pt-5 text-[13px] leading-relaxed text-[#a9b0dd]">
              征集结束后，我们将在取得授权并完成匿名汇总后，视情况发布相关洞察，
              并邀请部分单位参加一对一需求访谈。
            </p>
          </div>
        </div>
      </section>

      {/* ===== 征集表单 ===== */}
      <section id="cocreate" className="mx-auto max-w-3xl scroll-mt-6 px-6 py-16">
        <SectionTitle
          kicker="JOIN US"
          title="共创征集表"
          desc="这不是报名表。这是一次独立的市场研究行动 —— 收集真实需求、验证开班条件、听见真实问题。"
        />
        <CoCreateForm />
      </section>

      {/* ===== 系统学习入口 ===== */}
      <section id="training" className="scroll-mt-6 bg-[#f1efe8] py-16">
        <div className="mx-auto max-w-3xl px-6">
          <SectionTitle
            kicker="TOOLBOX"
            title="碳尺工具箱 · 系统学习入口"
            desc="面向已了解培训体系、不需要“被征集”的读者。"
          />
          <div className="space-y-5">
            {COURSES.map((c) => (
              <div key={c.name} className="rounded-2xl bg-white p-6 shadow-[0_4px_24px_rgba(26,35,126,0.06)] sm:p-7">
                <p className="text-[12.5px] font-bold tracking-[0.15em] text-[#8a6d00]">{c.org}</p>
                <h3 className="mt-2 text-[19px] font-bold leading-snug text-[#1a2030]">{c.name}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-[#5b6272]">{c.desc}</p>
                <div className="mt-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[14.5px] font-bold text-[#1a237e]">
                    了解详情
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.5">
                      <path d="M5 12h14m0 0-6-6m6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="rounded-full bg-[#faf8f3] px-3 py-1 text-[11.5px] text-[#9aa0ae]">
                    正式链接发布前由主办方确认后替换
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 隐私说明 ===== */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <SectionTitle kicker="PRIVACY" title="隐私说明" />
        <ul className="space-y-3.5 text-[14px] leading-relaxed text-[#5b6272]">
          <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a237e]" />本次征集的数据收集与使用，遵守《个人信息保护法》及相关法规。</li>
          <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a237e]" />您提交的信息仅用于本次共创征集的需求汇总、城市选址分析与一对一访谈邀约，不用于任何商业推销。</li>
          <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a237e]" />涉及单位经营策略、能耗数据、排放水平等敏感信息，将在取得授权并完成匿名汇总后，视情况以行业洞察形式发布。</li>
          <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a237e]" />本次不是正式报名，不收取任何费用；时间、地点和最终方案将根据征集结果确定。</li>
        </ul>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-[#0a0e33] py-12">
        <div className="mx-auto max-w-3xl px-6">
          <div className="tick-divider w-16" />
          <p className="mt-6 text-[15px] font-bold text-white">碳尺日记 · 碳标签零碳厨房</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#8f97c9]">
            中国低碳经济发展促进会 · 零碳厨房项目共创
          </p>
          <p className="mt-5 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-[#6f77a8]">
            本页面为需求征集页，不构成正式报名或收费承诺。文中涉及的标准引用以官方发布版本为准；
            评价体系的功能性表述以主办方最终确认的技术文件为准。
          </p>
        </div>
      </footer>
    </div>
  )
}
