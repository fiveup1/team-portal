# 產品一組常用服務

React + Vite + Supabase 打造的內部服務入口網站，全組共用連結清單（新增/刪除即時同步）。

## 部署前置作業（已完成，供備查）

在 Supabase SQL Editor 執行過以下建表指令：

```sql
create table product_team_links (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table product_team_links enable row level security;

create policy "public read" on product_team_links
  for select using (true);

create policy "public insert" on product_team_links
  for insert with check (true);

create policy "public delete" on product_team_links
  for delete using (true);
```

## 部署到 Vercel（照你熟悉的流程）

1. 用 **GitHub Desktop** 把這個資料夾發布成新的 GitHub repository（例如 `product-team-services`）
2. 到 [vercel.com](https://vercel.com) → **Add New Project** → 選剛剛的 repo → Import
3. Framework Preset 選 **Vite**，其餘保持預設 → Deploy
4. 之後在本機修改完，GitHub Desktop 提交並 push，Vercel 會自動重新部署

## 本機開發

```bash
npm install
npm run dev
```

## 注意事項

- `product_team_links` 資料表為公開讀寫（沒有登入機制），組內任何人拿到網址都能新增/刪除連結
- Supabase anon key 是公開金鑰，寫在 `src/supabaseClient.js` 裡是正常做法，不是密碼外洩
