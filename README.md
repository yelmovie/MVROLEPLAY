
  # Roleplay Script Generator

  This is a code bundle for Roleplay Script Generator. The original project is available at https://www.figma.com/design/URnO3gha3XoFlOMI8fomym/Roleplay-Script-Generator.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

## Supabase Data API grants (2026-10-30)

Existing tables keep their permissions. For a new database or a recreated server-side KV table, run this setup in the SQL Editor before deploying the Edge Function. The generated `kv_store` client uses `SUPABASE_SERVICE_ROLE_KEY` only on the server; never put that key in the browser.

```sql
begin;
create table if not exists public.kv_store_9b937296 (
  key text not null primary key,
  value jsonb not null
);
alter table public.kv_store_9b937296 enable row level security;
revoke all on table public.kv_store_9b937296 from public, anon, authenticated;
grant select, insert, update, delete on table public.kv_store_9b937296 to service_role;
commit;
```

Keep these grants with the table definition when importing this setup into your migration workflow. All other tables need their own operation-specific grants and RLS policies; do not restore automatic grants for the whole schema.
