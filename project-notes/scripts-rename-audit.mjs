// 全仓库旧名残留审计（排除 vendor / node_modules / .git / 文档）
// 用法: node scripts-rename-audit.mjs <repoRoot>
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, extname, sep } from 'node:path'

const root = process.argv[2]
const outFile = process.argv[3]

const SKIP_DIRS = new Set(['.git', 'node_modules', 'vendor', '.yarn', 'dist', 'build-cache', '.cache'])
// 文档类：第 1 项有意不改（D 组）
const DOC_EXT = new Set(['.md', '.mdx', '.txt'])

const PATTERNS = [
  ['DSH Desktop', /DSH Desktop/g],
  ['DSH-Desktop', /DSH-Desktop/g],
  ['DSH 终端', /DSH 终端/g],
  ['DSH Terminal', /DSH Terminal/g],
  ['DeepSeek Harness Desktop', /DeepSeek Harness Desktop/g],
]

const hits = []   // { file, line, pattern, text }
let scanned = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      walk(full)
      continue
    }
    if (!entry.isFile()) continue
    if (DOC_EXT.has(extname(entry.name).toLowerCase())) continue
    let stat
    try { stat = statSync(full) } catch { continue }
    if (stat.size > 4 * 1024 * 1024) continue
    let text
    try { text = readFileSync(full, 'utf8') } catch { continue }
    if (text.includes('\u0000')) continue          // 二进制
    scanned += 1
    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i += 1) {
      for (const [name, re] of PATTERNS) {
        re.lastIndex = 0
        if (re.test(lines[i])) {
          hits.push({ file: relative(root, full).split(sep).join('/'), line: i + 1, pattern: name, text: lines[i].trim().slice(0, 160) })
          break
        }
      }
    }
  }
}

walk(root)

const byFile = new Map()
for (const h of hits) {
  if (!byFile.has(h.file)) byFile.set(h.file, [])
  byFile.get(h.file).push(h)
}

const lines = []
lines.push(`扫描文件数（排除文档/依赖/二进制）: ${scanned}`)
lines.push(`命中文件数: ${byFile.size}   命中行数: ${hits.length}`)
lines.push('')
for (const [file, list] of [...byFile.entries()].sort()) {
  lines.push(`### ${file}  (${list.length})`)
  for (const h of list) lines.push(`  ${h.line}\t[${h.pattern}]\t${h.text}`)
  lines.push('')
}

const report = lines.join('\n')
writeFileSync(outFile, report, 'utf8')
console.log(report)
