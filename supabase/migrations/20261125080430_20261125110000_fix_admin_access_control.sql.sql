/*
# Fix admin access control gaps

1. Purpose
- Hardens the admin access control system that was set up in earlier migrations.
  Several gaps and inconsistencies are corrected here.

2. Changes

## 2.1 is_allowed_admin() rewrite
- Previously read from auth.users via a correlated subquery, which is fragile
  when search_path is not fully controlled.
- Rewritten as a PL/pgSQL function that explicitly resolves the caller's email
  from auth.users into a variable, then checks the allowlist. Returns false
  (not NULL) when the user has no email or is not in the allowlist.
- search_path set to 'public', 'auth' (as identifier list, not string literal).

## 2.2 admin_allowlist security hardening
- Revoke ALL from anon on admin_allowlist (previously anon had full CRUD —
  anyone could read/modify the allowlist without signing in).
- Grant SELECT only to authenticated (matches the existing SELECT policy).
- The add_admin / remove_admin SECURITY DEFINER functions handle writes, so
  no direct INSERT/UPDATE/DELETE grant is needed on admin_allowlist for any
  client role.

## 2.3 No data loss
- No tables or columns dropped or renamed.
- No rows deleted.
- Existing policies on all app tables remain unchanged.
*/

-- ============================================================
-- 1. Rewrite is_allowed_admin() to be robust
-- ============================================================
CREATE OR REPLACE FUNCTION is_allowed_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower((
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));
  IF v_email IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM admin_allowlist WHERE email = v_email
  );
END;
$$;

-- Re-grant to be safe (idempotent)
REVOKE EXECUTE ON FUNCTION is_allowed_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION is_allowed_admin() TO authenticated;

-- ============================================================
-- 2. Lock down admin_allowlist table
-- ============================================================
REVOKE ALL ON admin_allowlist FROM anon;
GRANT SELECT ON admin_allowlist TO authenticated;

-- Ensure only the read policy exists (writes go through functions)
DROP POLICY IF EXISTS "admin_read_allowlist" ON admin_allowlist;
CREATE POLICY "admin_read_allowlist" ON admin_allowlist
FOR SELECT TO authenticated
USING (is_allowed_admin());