import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import SortableTile from './SortableTile'

const PALETTE = ['#0077B6', '#00B4D8', '#0096C7', '#023E8A', '#0353A4', '#0096C7', '#014F86', '#48A9D6', '#005F8A', '#2A6F97']

const DEFAULT_LINKS = [
  { name: '客戶表', url: 'https://docs.google.com/spreadsheets/d/1H6DUayV-Xdhvl4mM15uMC7TU6plP-gd0KKp1dLn4Td8/edit?gid=1043587550#gid=1043587550' },
  { name: '出差勤', url: 'https://hour.changingtec.com:6445/e/sbE/leave/mr110Log.jsp' },
  { name: 'CRM', url: 'https://erp.changingtec.com/e/crm/' },
  { name: 'ERP', url: 'https://erp.changingtec.com/e/erp/' },
  { name: 'BOOKING', url: 'https://www.changingtec.com/distributor/' },
  { name: 'IDE測試機', url: 'https://192.168.15.193:8443/IDEWeb/' },
  { name: 'IDECLOUD', url: 'https://idecloud.changingtec.com/web/' },
  { name: 'FASTSIGN CLOUD', url: 'https://fastsign.chg.com.tw/FastSignCloud/login.html?group=6385e7f1-a8ca-45fa-b207-42f650245b68' },
  { name: 'FASTSIGN PRO', url: 'https://fspro.changingtec.com/FastSignPro/login.html' },
  { name: '來毅-業務開發', url: 'https://docs.google.com/spreadsheets/d/1-arA1QsAXZh_sQLNchF4sMWqTzKkRR2h/edit?usp=sharing&ouid=111169979555478274270&rtpof=true&sd=true' },
  { name: 'HSM-業務開發', url: 'https://docs.google.com/spreadsheets/d/1wDcTrxMv_kur39f7LZ2Y4sHrLqM1pRmbnGR-PRFevuA/edit?usp=sharing' },
  { name: 'Yule-新訓表', url: 'https://docs.google.com/spreadsheets/d/1yxFX3hwTzF1aDWywJeuKwd6pAL9_w4VliC9f2gZzv88/edit?gid=0#gid=0' },
  { name: 'IDEXPERT 價格表', url: 'https://docs.google.com/spreadsheets/d/1HudAHf3XtLUI6fAe03XusU-pMYgRHKLf/edit?usp=sharing&ouid=111169979555478274270&rtpof=true&sd=true' },
]

function hashStr(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}
function getMonogram(name) {
  const trimmed = name.trim()
  const asciiMatch = trimmed.match(/^[A-Za-z0-9]+/)
  if (asciiMatch && asciiMatch[0].length >= 2) return asciiMatch[0].slice(0, 4)
  return trimmed.slice(0, 2) || '?'
}
function getColor(name) {
  return PALETTE[hashStr(name) % PALETTE.length]
}

export default function App() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [delTarget, setDelTarget] = useState(null) // {id, name}
  const [toast, setToast] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const toastTimer = useRef(null)
  const nameInputRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  useEffect(() => {
    loadLinks()
  }, [])

  function showToast(msg) {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2200)
  }

  async function loadLinks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_team_links')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })

    if (error) {
      console.error('讀取失敗', error)
      showToast('讀取連結清單失敗')
      setLoading(false)
      return
    }

    if (data.length === 0) {
      const seedRows = DEFAULT_LINKS.map((link, idx) => ({ ...link, position: idx + 1 }))
      const { data: seeded, error: seedError } = await supabase
        .from('product_team_links')
        .insert(seedRows)
        .select()
      if (seedError) {
        console.error('初始化失敗', seedError)
        setLinks([])
      } else {
        setLinks([...seeded].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)))
      }
    } else {
      setLinks(data)
    }
    setLoading(false)
  }

  async function handleAdd() {
    const name = newName.trim()
    let url = newUrl.trim()
    if (!name || !url) return
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url

    const nextPosition = links.reduce((max, l) => Math.max(max, l.position ?? 0), 0) + 1

    const { data, error } = await supabase
      .from('product_team_links')
      .insert([{ name, url, position: nextPosition }])
      .select()

    if (error) {
      console.error('新增失敗', error)
      showToast('新增失敗，請稍後再試')
      return
    }
    setLinks(prev => [...prev, ...data])
    setAddOpen(false)
    setNewName('')
    setNewUrl('')
    showToast('已新增「' + name + '」')
  }

  async function handleDelete() {
    if (!delTarget) return
    const { id, name } = delTarget
    const { error } = await supabase.from('product_team_links').delete().eq('id', id)
    if (error) {
      console.error('刪除失敗', error)
      showToast('刪除失敗，請稍後再試')
      setDelTarget(null)
      return
    }
    setLinks(prev => prev.filter(l => l.id !== id))
    setDelTarget(null)
    showToast('已刪除「' + name + '」')
  }

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLinks(prev => {
      const oldIndex = prev.findIndex(l => l.id === active.id)
      const newIndex = prev.findIndex(l => l.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  async function handleFinishEdit() {
    setSavingOrder(true)
    const updates = links.map((l, i) => ({ id: l.id, position: i + 1 }))
    const { error } = await supabase.from('product_team_links').upsert(updates)
    setSavingOrder(false)
    if (error) {
      console.error('儲存順序失敗', error)
      showToast('儲存順序失敗，請稍後再試')
      return
    }
    setEditMode(false)
    showToast('排序已儲存')
  }

  const filtered = query.trim()
    ? links.filter(l => l.name.toLowerCase().includes(query.trim().toLowerCase()))
    : links

  return (
    <>
      <header>
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark"><span></span><span></span><span></span><span></span></div>
            <div className="brand-text">
              <h1>產品一組常用服務</h1>
              <p>一鍵直達組內常用系統與表單</p>
            </div>
          </div>
          <div className="header-actions">
            {!editMode && (
              <div className="search-wrap">
                <input
                  type="text"
                  placeholder="搜尋連結名稱..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            )}
            {!loading && !editMode && (
              <button className="edit-toggle-btn" onClick={() => setEditMode(true)}>
                <span className="edit-icon">✎</span> 編輯排序
              </button>
            )}
            {editMode && (
              <button className="edit-toggle-btn done" onClick={handleFinishEdit} disabled={savingOrder}>
                {savingOrder ? '儲存中...' : '完成'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main>
        {loading && <div className="grid"><div className="empty-hint">載入中...</div></div>}

        {!loading && editMode && (
          <>
            <p className="edit-hint">拖拉圖示調整順序，點左上角「－」可以刪除</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={links.map(l => l.id)} strategy={rectSortingStrategy}>
                <div className="grid">
                  {links.map((link, idx) => (
                    <SortableTile
                      key={link.id}
                      link={link}
                      index={idx}
                      getColor={getColor}
                      getMonogram={getMonogram}
                      onRequestDelete={setDelTarget}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

        {!loading && !editMode && (
          <div className="grid">
            {filtered.map(link => (
              <a key={link.id} className="tile" href={link.url} target="_blank" rel="noopener noreferrer">
                <div className="badge" style={{ background: getColor(link.name) }}>
                  {getMonogram(link.name)}
                </div>
                <div className="tile-name">{link.name}</div>
              </a>
            ))}

            {!query.trim() && (
              <div
                className="tile add-tile"
                onClick={() => {
                  setAddOpen(true)
                  setTimeout(() => nameInputRef.current?.focus(), 50)
                }}
              >
                <div className="add-badge">+</div>
                <div className="tile-name">新增連結</div>
              </div>
            )}

            {filtered.length === 0 && query.trim() && (
              <div className="empty-hint">找不到符合「{query.trim()}」的連結</div>
            )}
          </div>
        )}
      </main>

      <footer>
        共用清單：所有組員新增或刪除的連結會同步顯示給大家。刪除前會再次確認，請小心操作。
      </footer>

      {addOpen && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setAddOpen(false) }}>
          <div className="modal">
            <h3>新增連結</h3>
            <p className="sub">輸入名稱與網址，確認後會加入清單並同步給全組。</p>
            <div className="field">
              <label>名稱</label>
              <input
                ref={nameInputRef}
                type="text"
                maxLength={30}
                placeholder="例如：客戶表"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>網址</label>
              <input
                type="text"
                placeholder="https://..."
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setAddOpen(false)}>取消</button>
              <button
                className="btn btn-primary"
                disabled={!newName.trim() || !newUrl.trim()}
                onClick={handleAdd}
              >
                新增
              </button>
            </div>
          </div>
        </div>
      )}

      {delTarget && (
        <div className="overlay" onClick={e => { if (e.target === e.currentTarget) setDelTarget(null) }}>
          <div className="modal">
            <h3>刪除連結</h3>
            <p className="sub">確定要刪除「<span className="delete-target">{delTarget.name}</span>」嗎？此操作無法復原。</p>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setDelTarget(null)}>取消</button>
              <button className="btn btn-danger" onClick={handleDelete}>刪除</button>
            </div>
          </div>
        </div>
      )}

      <div className={'toast' + (toast ? ' show' : '')}>{toast}</div>
    </>
  )
}
